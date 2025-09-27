import { NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';
import { IDL } from "@/generated/votingsystemdapp-idl-simple"

// Handle BigInt serialization
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

// Program ID from the deployed Solana program (replace with your actual deployed program ID)
const PROGRAM_ID_STRING = process.env.NEXT_PUBLIC_PROGRAM_ID || "CfU2hH8HEy6UQhiEeECeJL66112N18EuYq1khpX2N1RF";

// RPC URL for Solana connection - explicitly use devnet
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=28bfff14-4e1a-447d-ba02-2b8bf09c1dc1';

/**
 * POST handler for creating a poll on the Solana blockchain
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { name, description, options, startTime, endTime, isPublic, creator } = body;
    
    // Validate request body
    if (!name || !description || !options || !startTime || !endTime || isPublic === undefined || !creator) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Basic validation
    if (options.length < 2) {
      return NextResponse.json({ error: 'At least 2 options required' }, { status: 400 });
    }
    
    if (endTime <= startTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }
    
    console.log('Creating poll with data:', {
      name,
      description,
      optionsCount: options.length,
      startTime,
      endTime,
      isPublic,
      creator,
      network: 'devnet',
      rpcUrl: RPC_URL
    });

    try {
      // Create a connection to Solana - explicitly use devnet
      const connection = new Connection(RPC_URL, 'confirmed');
      console.log('Connected to Solana devnet at:', RPC_URL);
      
      // Generate a new keypair for the poll
      const pollKeypair = Keypair.generate();
      console.log('Generated poll keypair:', pollKeypair.publicKey.toString());
      
      // Create creator public key
      let creatorPubkey: PublicKey;
      try {
        creatorPubkey = new PublicKey(creator);
      } catch (pubkeyError) {
        console.error('Invalid creator public key:', pubkeyError);
        return NextResponse.json({ 
          error: 'Invalid creator public key format' 
        }, { status: 400 });
      }
      
      // Create program ID
      let programId: PublicKey;
      try {
        programId = new PublicKey(PROGRAM_ID_STRING);
      } catch (error) {
        console.error('Invalid program ID:', error);
        return NextResponse.json({ 
          error: 'Invalid program ID format' 
        }, { status: 500 });
      }

      // Convert timestamps to BN (which is what Solana programs expect)
      const startTimeBN = new BN(Math.floor(startTime));
      const endTimeBN = new BN(Math.floor(endTime));
      
      try {
        // Create a transaction to store the poll on the blockchain
        const transaction = new Transaction();
        
        // Get the latest blockhash for the transaction with retries
        let blockhash;
        let lastValidBlockHeight;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount <= maxRetries) {
          try {
            console.log(`Attempting to fetch blockhash (attempt ${retryCount + 1}/${maxRetries + 1})...`);
            const result = await connection.getLatestBlockhash('confirmed');
            blockhash = result.blockhash;
            lastValidBlockHeight = result.lastValidBlockHeight;
            console.log('Successfully retrieved blockhash:', blockhash);
            break;
          } catch (error) {
            console.error(`Failed to get blockhash (attempt ${retryCount + 1}):`, error);
            retryCount++;
            
            if (retryCount > maxRetries) {
              throw new Error('Failed to get blockhash after multiple attempts');
            }
            
            // Wait before retrying
            const delay = 1000 * Math.pow(1.5, retryCount);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        // Apply blockhash to transaction
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        
        // Set the fee payer explicitly as the creator (client wallet)
        transaction.feePayer = creatorPubkey;
        
        console.log('Using blockhash:', blockhash, 'lastValidBlockHeight:', lastValidBlockHeight);
        
        // Create anchor provider and program
        const readOnlyWallet = {
          publicKey: creatorPubkey,
          signTransaction: () => Promise.reject('Not implemented'),
          signAllTransactions: () => Promise.reject('Not implemented'),
        };
        
        const provider = new anchor.AnchorProvider(
          connection,
          readOnlyWallet as any,
          { commitment: 'confirmed' }
        );
        
        const program = new anchor.Program(IDL as any, provider);
        
        // Create the create_poll instruction
        const createPollIx = await (program as any).methods
          .createPoll(
            name,
            description,
            options,
            new anchor.BN(startTime),
            new anchor.BN(endTime),
            isPublic
          )
          .accounts({
            creator: creatorPubkey,
            poll: pollKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([pollKeypair])
          .instruction();
        
        transaction.add(createPollIx);
        
        // Partially sign the transaction with the poll keypair
        transaction.partialSign(pollKeypair);
        
        // Serialize the transaction for the client to complete
        const serializedTx = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false
        }).toString('base64');
        
        // Return the transaction and poll address to the client
        return NextResponse.json({
          success: true,
          pollAddress: pollKeypair.publicKey.toString(),
          transaction: serializedTx,
          message: 'Transaction created for storing poll on the blockchain',
          network: 'devnet'
        });
      } catch (txError: any) {
        console.error('Error creating poll transaction:', txError);
        return NextResponse.json({ 
          error: `Failed to create blockchain transaction: ${txError.message || 'Unknown error'}` 
        }, { status: 500 });
      }
    } catch (error: any) {
      console.error('Error in blockchain operation:', error);
      return NextResponse.json({ 
        error: `Blockchain error: ${error.message || 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API handler error:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 
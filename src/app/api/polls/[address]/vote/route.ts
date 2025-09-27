import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { IDL } from '@/generated/votingsystemdapp-idl';
import { SOLANA_RPC_URL, PROGRAM_ID_STRING, COMMITMENT_LEVEL } from '@/lib/solana-config';


/**
 * POST endpoint for voting on a poll
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // Properly await the params object
    const paramsObj = await params;
    const address = paramsObj.address;
    
    if (!address) {
      return NextResponse.json({ error: 'Poll address is required' }, { status: 400 });
    }
    
    // Parse request body
    const body = await request.json();
    const { optionIndex, voter, isPublic } = body;
    
    if (optionIndex === undefined || !voter) {
      return NextResponse.json({ 
        error: 'Missing required fields: optionIndex and voter are required' 
      }, { status: 400 });
    }
    
    // Special case for example poll
    if (address === 'example') {
      return NextResponse.json({
        success: true,
        message: 'Vote recorded on example poll',
        note: 'This is a simulated vote on an example poll'
      });
    }
    
    // Real blockchain voting implementation
    try {
      // Validate the poll address
      const pollPublicKey = new PublicKey(address);
      
      // Set up connection to Solana
      const connection = new Connection(SOLANA_RPC_URL, COMMITMENT_LEVEL);
      
      // Create a mock wallet for reading poll data
      const readOnlyWallet = {
        publicKey: PublicKey.default,
        signTransaction: () => Promise.reject('Not implemented'),
        signAllTransactions: () => Promise.reject('Not implemented'),
      };
      
      const provider = new anchor.AnchorProvider(
        connection,
        readOnlyWallet as any,
        { commitment: COMMITMENT_LEVEL }
      );
      
      // Get the poll data to check if it's public or private
      const programId = new PublicKey(PROGRAM_ID_STRING);
      const program = new anchor.Program(IDL as any, provider);
      const pollAccount = await (program as any).account.poll.fetch(pollPublicKey);
      
      if (!pollAccount) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }
      
      // Check if poll is active and within time bounds
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime < pollAccount.startTime || currentTime > pollAccount.endTime) {
        return NextResponse.json({ error: 'Poll is not currently active' }, { status: 400 });
      }
      
      if (!pollAccount.isActive) {
        return NextResponse.json({ error: 'Poll has been closed' }, { status: 400 });
      }
      
      // Create the voting transaction
      const voterPublicKey = new PublicKey(voter);
      const transaction = new Transaction();
      
      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(COMMITMENT_LEVEL);
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = voterPublicKey;
      
      // Create the vote instruction based on poll type
      let voteIx;
      
      if (pollAccount.isPublic) {
        // Public poll voting
        const [voteRecordPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("vote-record"),
            pollPublicKey.toBuffer(),
            voterPublicKey.toBuffer()
          ],
          programId
        );
        
        voteIx = await (program as any).methods
          .castVotePublic(optionIndex)
          .accounts({
            voter: voterPublicKey,
            poll: pollPublicKey,
            voteRecord: voteRecordPda,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
      } else {
        // Private poll voting
        const [voterRegistryPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("voter-registry"),
            pollPublicKey.toBuffer(),
            voterPublicKey.toBuffer()
          ],
          programId
        );
        
        voteIx = await (program as any).methods
          .castVotePrivate(optionIndex)
          .accounts({
            voter: voterPublicKey,
            poll: pollPublicKey,
            voterRegistry: voterRegistryPda,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
      }
      
      transaction.add(voteIx);
      
      // Serialize the transaction for the client to sign
      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });
      
      return NextResponse.json({
        success: true,
        message: 'Vote transaction prepared',
        transaction: Array.from(serializedTx),
        details: {
          poll: address,
          option: optionIndex,
          voter,
          isPublic: pollAccount.isPublic
        }
      });
      
    } catch (blockchainError: any) {
      console.error('Blockchain error:', blockchainError);
      return NextResponse.json({ 
        error: `Blockchain error: ${blockchainError.message || 'Unknown blockchain error'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API handler error:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 
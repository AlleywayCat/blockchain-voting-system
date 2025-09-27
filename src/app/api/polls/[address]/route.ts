import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Votingsystemdapp, IDL } from '@/generated/votingsystemdapp-idl'

// Handle BigInt serialization
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

// Program ID from the deployed Solana program
const PROGRAM_ID_STRING = process.env.NEXT_PUBLIC_PROGRAM_ID || "CfU2hH8HEy6UQhiEeECeJL66112N18EuYq1khpX2N1RF";

// RPC URL for Solana connection
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=28bfff14-4e1a-447d-ba02-2b8bf09c1dc1';

// Example account layout for poll data (customize based on your program's actual account structure)
interface PollAccount {
  name: string;
  description: string;
  options: string[];
  startTime: anchor.BN;
  endTime: anchor.BN;
  isPublic: boolean;
  creator: PublicKey;
  votes: { [key: string]: number };
}

// GET endpoint to retrieve a poll by address from the blockchain
export async function GET(
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
    
    console.log(`Fetching poll with address: ${address}`);
    
    // Validate that the address is a valid PublicKey
    let pollPublicKey: PublicKey;
    try {
      // Special case for example poll
      if (address === 'example') {
        // Create a deterministic public key for example polls
        pollPublicKey = PublicKey.default;
        
        // Return example data for the example poll ID
        return NextResponse.json({
          success: true,
          poll: {
            name: 'Example Poll',
            description: 'This is an example poll for testing',
            options: ['Yes', 'No', 'Maybe'],
            startTime: Math.floor(Date.now() / 1000),
            endTime: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
            isPublic: true,
            isActive: true,
            creator: 'CaM5Uhke4WWR5aar7RKDKhYQu2o4gHc4ugMHcGJ6yfku',
            votes: {
              'Yes': 5,
              'No': 3,
              'Maybe': 2
            }
          },
          note: 'Using example data'
        });
      }
      
      // For real addresses, validate the PublicKey
      pollPublicKey = new PublicKey(address);
    } catch (error) {
      console.error('Invalid poll address:', error);
      return NextResponse.json({ error: 'Invalid poll address format' }, { status: 400 });
    }
    
    // Set up connection to Solana
    const connection = new Connection(RPC_URL, 'confirmed');
    
    // Set up program ID
    let programId: PublicKey;
    try {
      programId = new PublicKey(PROGRAM_ID_STRING);
    } catch (error) {
      console.error('Invalid program ID:', error);
      return NextResponse.json({ error: 'Invalid program ID format' }, { status: 500 });
    }
    
    // Create a read-only provider (no wallet needed for reading)
    const readOnlyWallet = {
      publicKey: PublicKey.default,
      signTransaction: () => Promise.reject('Not implemented'),
      signAllTransactions: () => Promise.reject('Not implemented'),
    };
    
    const provider = new anchor.AnchorProvider(
      connection,
      readOnlyWallet as any,
      { commitment: 'confirmed', preflightCommitment: 'confirmed' }
    );
    
    // Set up the program
    let program: Program<Votingsystemdapp>;
    try {
      // Use the real Anchor program with proper typing
      program = new anchor.Program(IDL, provider);
      console.log("Program initialized successfully with real Anchor program");
    } catch (programInitError) {
      console.error("Failed to initialize program:", programInitError);
      return NextResponse.json({ error: 'Failed to initialize program' }, { status: 500 });
    }
    
    try {
      console.log('Fetching account data for:', pollPublicKey.toString());
      
      // Try to fetch the account data from the blockchain
      const account = await program.account.poll.fetch(pollPublicKey);
      
      if (!account) {
        console.log('Poll account not found on blockchain');
        return NextResponse.json({ error: 'Poll not found on blockchain' }, { status: 404 });
      }
      
      console.log('Poll account data fetched successfully');
      
      console.log('Raw account data:', account);
      
      // Transform the account data into a more client-friendly format
      const poll = {
        name: account.name,
        description: account.description,
        options: account.options.map((opt: any) => ({
          text: opt.text || opt,
          voteCount: opt.voteCount || 0
        })),
        startTime: account.startTime.toNumber(),
        endTime: account.endTime.toNumber(),
        isPublic: account.isPublic,
        isActive: account.isActive,
        creator: account.creator.toString(),
        votes: account.options.reduce((result: any, option: any) => {
          const optionText = option.text || option;
          result[optionText] = option.voteCount || 0;
          return result;
        }, {})
      };
      
      // Return the poll data
      return NextResponse.json({
        success: true,
        poll
      });
    } catch (accountError: any) {
      console.error('Error fetching poll account data:', accountError);
      
      return NextResponse.json({ 
        error: `Failed to fetch poll data: ${accountError.message || 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API handler error:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 
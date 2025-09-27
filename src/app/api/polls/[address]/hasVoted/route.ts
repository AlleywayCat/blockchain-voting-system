import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { IDL } from "@/generated/votingsystemdapp-idl-simple"

// Program ID from the deployed Solana program
const PROGRAM_ID_STRING = process.env.NEXT_PUBLIC_PROGRAM_ID || "CfU2hH8HEy6UQhiEeECeJL66112N18EuYq1khpX2N1RF";

// RPC URL for Solana connection
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=28bfff14-4e1a-447d-ba02-2b8bf09c1dc1';

/**
 * GET endpoint to check if a voter has voted on a specific poll
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // Get the poll address from the URL params
    const resolvedParams = await params;
    const address = resolvedParams.address;
    const { searchParams } = new URL(request.url);
    const voter = searchParams.get('voter');
    
    if (!address) {
      return NextResponse.json({ error: 'Poll address is required' }, { status: 400 });
    }
    
    if (!voter) {
      return NextResponse.json({ error: 'Voter address is required' }, { status: 400 });
    }
    
    // Special case for example poll
    if (address === 'example') {
      // Simulate a 50/50 chance of having voted for testing
      const hasVoted = Math.random() > 0.5;
      return NextResponse.json({
        success: true,
        hasVoted,
        note: 'This is simulated data for an example poll'
      });
    }
    
    // Real blockchain interaction to check if user has voted
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const pollPublicKey = new PublicKey(address);
      const voterPublicKey = new PublicKey(voter);
      const programId = new PublicKey(PROGRAM_ID_STRING);
      
      // Create provider
      const readOnlyWallet = {
        publicKey: PublicKey.default,
        signTransaction: () => Promise.reject('Not implemented'),
        signAllTransactions: () => Promise.reject('Not implemented'),
      };
      
      const provider = new anchor.AnchorProvider(
        connection,
        readOnlyWallet as any,
        { commitment: 'confirmed' }
      );
      
      const program = new anchor.Program(IDL as any, provider);
      
      // Get the poll to check if it's public or private
      const pollAccount = await (program as any).account.poll.fetch(pollPublicKey);
      
      if (!pollAccount) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }
      
      let hasVoted = false;
      
      if (pollAccount.isPublic) {
        // Check vote record for public polls
        const [voteRecordPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("vote-record"),
            pollPublicKey.toBuffer(),
            voterPublicKey.toBuffer()
          ],
          programId
        );
        
        try {
          const voteRecord = await (program as any).account.voteRecord.fetch(voteRecordPda);
          hasVoted = voteRecord.hasVoted;
        } catch (error) {
          // Vote record doesn't exist, so user hasn't voted
          hasVoted = false;
        }
      } else {
        // Check voter registry for private polls
        const [voterRegistryPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("voter-registry"),
            pollPublicKey.toBuffer(),
            voterPublicKey.toBuffer()
          ],
          programId
        );
        
        try {
          const voterRegistry = await (program as any).account.voterRegistry.fetch(voterRegistryPda);
          hasVoted = voterRegistry.hasVoted;
        } catch (error) {
          // Voter registry doesn't exist, so user hasn't voted or isn't registered
          hasVoted = false;
        }
      }
      
      return NextResponse.json({
        success: true,
        hasVoted,
        message: `User has ${hasVoted ? '' : 'not '}voted on this poll`
      });
    } catch (blockchainError) {
      console.error('Error checking vote status:', blockchainError);
      return NextResponse.json({
        success: true,
        hasVoted: false,
        message: 'Error checking vote status - defaulting to not voted'
      });
    }
  } catch (error: any) {
    console.error('API handler error:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 
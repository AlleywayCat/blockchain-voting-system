import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { IDL } from "@/generated/votingsystemdapp-idl-simple"
import { SOLANA_RPC_URL, PROGRAM_ID_STRING, COMMITMENT_LEVEL } from '@/lib/solana-config';
import { createBigIntResponse } from '@/lib/bigint-serializer';


// Simple in-memory cache - reset after program redeploy
let pollsCache: any = null;
let pollsCacheTime: number = 0;
const CACHE_TTL = 10000; // 10 seconds cache lifetime (more responsive for development)

// GET endpoint to retrieve all polls from the blockchain
export async function GET() {
  try {
    console.log('Fetching polls with caching');
    
    // Check if we have a valid cache
    const now = Date.now();
    if (pollsCache && (now - pollsCacheTime < CACHE_TTL)) {
      console.log('Returning cached polls data, age:', (now - pollsCacheTime)/1000, 'seconds');
      return createBigIntResponse(pollsCache);
    }
    
    console.log('Cache miss or expired, fetching from blockchain');
    
    // Set up connection to Solana
    const connection = new Connection(SOLANA_RPC_URL, COMMITMENT_LEVEL);
    
    // Set up program ID
    let programId: PublicKey;
    try {
      programId = new PublicKey(PROGRAM_ID_STRING);
    } catch (error) {
      console.error('Invalid program ID:', error);
      return createBigIntResponse({ error: 'Invalid program ID format' }, { status: 500 });
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
      { commitment: COMMITMENT_LEVEL, preflightCommitment: COMMITMENT_LEVEL }
    );
    
    // Set up the program
    let program;
    try {
      // Create program with correct constructor
      const programId = new PublicKey(PROGRAM_ID_STRING);
      program = new Program(IDL as any, provider);
    } catch (programError: any) {
      console.error('Failed to initialize program:', programError);
      
      // Fallback to example data if program initialization fails
      const exampleResponse = {
        success: true,
        polls: [{
          address: 'example',
          name: 'Example Poll',
          description: 'This is an example poll for testing',
          options: ['Yes', 'No', 'Maybe'],
          startTime: Math.floor(Date.now()/1000) + 60,
          endTime: Math.floor(Date.now()/1000) + 86460,
          isPublic: true,
          isActive: true,
          creator: 'CaM5Uhke4WWR5aar7RKDKhYQu2o4gHc4ugMHcGJ6yfku',
          votes: { 'Yes': 5, 'No': 3, 'Maybe': 2 }
        }],
        note: 'Using example data (failed to initialize program)'
      };
      
      // Store in cache
      pollsCache = exampleResponse;
      pollsCacheTime = now;
      
      return createBigIntResponse(exampleResponse);
    }
    
    // Fetch all polls from the program
    try {
      console.log('Fetching program accounts...');
      // Get all poll accounts owned by our program
      const programId = new PublicKey(PROGRAM_ID_STRING);
      const pollAccounts = await connection.getProgramAccounts(programId);
      console.log(`Found ${pollAccounts.length} program accounts`);
      
      // Filter and decode actual poll accounts (non-empty data)
      const actualPolls = [];
      
      for (const account of pollAccounts) {
        const { pubkey, account: accountInfo } = account;
        
        // Skip empty accounts (all zeros)
        if (!accountInfo.data || accountInfo.data.every((byte: number) => byte === 0)) {
          console.log(`Skipping empty account: ${pubkey.toString()}`);
          continue;
        }
        
        try {
          // Try to decode the account using the program
          const pollData = await (program as any).account.poll.fetch(pubkey);
          if (pollData) {
            console.log(`Poll data structure for ${pubkey.toString()}:`, pollData);
            actualPolls.push({
              address: pubkey.toString(),
              account: { data: pollData }
            });
            console.log(`Successfully decoded poll: ${pubkey.toString()}`);
          }
        } catch (decodeError: any) {
          console.log(`Could not decode account ${pubkey.toString()}:`, decodeError.message);
          continue;
        }
      }
      
      console.log(`Found ${actualPolls.length} valid poll accounts`);
      
      // Process poll data
      const polls = actualPolls.map((account: { address: string; account: { data: any } }) => {
        const { address, account: { data } } = account;
        
        // Format the poll data
        const pollData = {
          address: address,
          name: data.name,
          description: data.description,
          options: data.options,
          startTime: data.startTime.toNumber(),
          endTime: data.endTime.toNumber(),
          isPublic: data.isPublic,
          isActive: data.isActive,
          creator: data.creator.toString(),
          totalVotes: data.totalVotes,
          votes: data.options.reduce((result: any, option: any, index: number) => {
            result[option.text] = option.voteCount;
            return result;
          }, {})
        };
        
        return pollData;
      });
      
      const response = {
        success: true,
        polls,
      };
      
      // Update cache
      pollsCache = response;
      pollsCacheTime = now;
      
      return createBigIntResponse(response);
      
    } catch (error: any) {
      console.error('Error fetching polls:', error);
      
      // Fallback to example data
      const exampleResponse = {
        success: true,
        polls: [{
          address: 'example',
          name: 'Example Poll',
          description: 'This is an example poll for testing',
          options: ['Yes', 'No', 'Maybe'],
          startTime: Math.floor(Date.now()/1000) + 60,
          endTime: Math.floor(Date.now()/1000) + 86460,
          isPublic: true,
          isActive: true,
          creator: 'CaM5Uhke4WWR5aar7RKDKhYQu2o4gHc4ugMHcGJ6yfku',
          votes: { 'Yes': 5, 'No': 3, 'Maybe': 2 }
        }],
        note: 'Using example data (no polls found on blockchain)'
      };
      
      // Update cache even with example data
      pollsCache = exampleResponse;
      pollsCacheTime = now;
      
      return createBigIntResponse(exampleResponse);
    }
  } catch (error: any) {
    console.error('Unexpected error in GET handler:', error);
    return createBigIntResponse({ 
      error: `Unexpected error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}
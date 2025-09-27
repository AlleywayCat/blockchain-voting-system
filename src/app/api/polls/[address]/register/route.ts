import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { IDL } from "@/generated/votingsystemdapp-idl-simple"

// Program ID from the deployed Solana program
const PROGRAM_ID_STRING = process.env.NEXT_PUBLIC_PROGRAM_ID || "CfU2hH8HEy6UQhiEeECeJL66112N18EuYq1khpX2N1RF";

// RPC URL for Solana connection
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=28bfff14-4e1a-447d-ba02-2b8bf09c1dc1';

/**
 * POST endpoint for registering a voter for a poll
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
    const { voter } = body;
    
    if (!voter) {
      return NextResponse.json({ 
        error: 'Missing required field: voter is required' 
      }, { status: 400 });
    }
    
    // Special case for example poll
    if (address === 'example') {
      return NextResponse.json({
        success: true,
        message: 'Voter registered for example poll',
        note: 'This is a simulated registration on an example poll'
      });
    }
    
    // For real blockchain interaction in production:
    // You would need to implement blockchain calls here
    // This is where you would call the program's registration method
    
    // For now, return a success response
    return NextResponse.json({
      success: true,
      message: 'Voter registered (mock implementation)',
      details: {
        poll: address,
        voter
      }
    });
  } catch (error: any) {
    console.error('API handler error:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 
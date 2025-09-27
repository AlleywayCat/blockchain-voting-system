import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { IDL } from "@/generated/votingsystemdapp-idl-simple"
import { SOLANA_RPC_URL, PROGRAM_ID_STRING, COMMITMENT_LEVEL } from '@/lib/solana-config';


/**
 * GET endpoint to check if a voter is registered for a specific poll
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // Properly await the params object
    const paramsObj = await params;
    const address = paramsObj.address;
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
      // Simulate a 75% chance of being registered for testing
      const isRegistered = Math.random() > 0.25;
      return NextResponse.json({
        success: true,
        isRegistered,
        note: 'This is simulated data for an example poll'
      });
    }
    
    // For real blockchain interaction in production:
    // Implement the blockchain calls to check if the user is registered
    
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      isRegistered: true, // Default to registered for simplicity
      message: 'Mock implementation - default to registered'
    });
  } catch (error: any) {
    console.error('API handler error:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 
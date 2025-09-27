import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { IDL } from "@/generated/votingsystemdapp-idl-simple"

const PROGRAM_ID_STRING = process.env.NEXT_PUBLIC_PROGRAM_ID!
const RPC_URL = 'https://devnet.helius-rpc.com/?api-key=28bfff14-4e1a-447d-ba02-2b8bf09c1dc1'

export async function POST(
  request: NextRequest,
  params: { params: Promise<{ address: string }> }
): Promise<NextResponse> {
  try {
    const { address } = await params.params
    const { authority } = await request.json()

    if (!authority) {
      return NextResponse.json({ error: 'Authority address is required' }, { status: 400 })
    }

    console.log(`Preparing delete transaction for poll: ${address} by authority: ${authority}`)

    // Connect to Solana
    const connection = new Connection(RPC_URL, 'confirmed')
    
    // Create public keys
    const pollPublicKey = new PublicKey(address)
    const authorityPublicKey = new PublicKey(authority)
    const programId = new PublicKey(PROGRAM_ID_STRING)

    // Create provider (no wallet needed for creating unsigned transactions)
    const provider = new anchor.AnchorProvider(
      connection,
      {} as any, // No wallet needed for unsigned transactions
      { commitment: 'confirmed' }
    )

    // Create program instance
    const program = new anchor.Program(IDL as any, provider)

    // Get fresh blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')

    // Create transaction
    const transaction = new Transaction()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    transaction.feePayer = authorityPublicKey

    // Create delete poll instruction
    const deletePollIx = await (program as any).methods
      .deletePoll()
      .accounts({
        authority: authorityPublicKey,
        poll: pollPublicKey,
      })
      .instruction()

    transaction.add(deletePollIx)

    // Serialize transaction for client signing
    const serializedTx = transaction.serialize({ 
      requireAllSignatures: false, 
      verifySignatures: false 
    })

    console.log(`Delete transaction prepared for poll: ${address}`)

    return NextResponse.json({
      success: true,
      transaction: Array.from(serializedTx),
      message: 'Transaction prepared for deleting poll and recovering rent',
      blockhash,
      lastValidBlockHeight
    })

  } catch (error) {
    console.error('Error preparing delete transaction:', error)
    return NextResponse.json({ 
      error: 'Failed to prepare delete transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

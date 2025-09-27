"use client";

import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { AppHero } from '@/components/ui/ui-layout'
import { CreatePoll } from '@/components/voting/CreatePoll'
import { WalletButton } from '@/components/solana/solana-provider'

export default function CreatePollPage() {
  const { connected } = useWallet()
  
  if (!connected) {
    return (
      <>
        <AppHero
          title="Connect Your Wallet"
          subtitle="Please connect your Solana wallet to create a new poll. Your wallet is required to authenticate and create polls on the blockchain."
        >
          <div className="mt-10 flex items-center justify-center">
            <WalletButton />
          </div>
        </AppHero>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Blockchain Authentication</h3>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your wallet serves as your secure identity on the blockchain. Once connected, you&apos;ll be able to create polls that are permanently stored and verified on the Solana network.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }
  
  return (
    <>
      <AppHero
        title="Create a New Poll"
        subtitle="Set up your decentralized voting poll with customizable options and settings"
      />
      
      <div className="container-main pb-16">
        <CreatePoll />
      </div>
    </>
  )
} 
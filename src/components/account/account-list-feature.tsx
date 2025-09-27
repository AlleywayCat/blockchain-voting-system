'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { redirect } from 'next/navigation'
import { WalletButton } from '../solana/solana-provider'
import { Wallet } from 'lucide-react'
import { useEffect } from 'react'

export default function AccountListFeature() {
  const { publicKey, wallets, wallet } = useWallet()

  // Debug logging for wallet detection
  useEffect(() => {
    console.log('🔍 Wallet Detection Debug:')
    console.log('- Available wallets:', wallets.length)
    console.log('- Wallet details:', wallets.map(w => ({ name: w.adapter.name, readyState: w.readyState })))
    console.log('- Current wallet:', wallet?.adapter.name)
    console.log('- Public key:', publicKey?.toString())
  }, [wallets, wallet, publicKey])

  if (publicKey) {
    return redirect(`/account/${publicKey.toString()}`)
  }

  return (
    <section className="relative py-24 lg:py-32">
      <div className="container mx-auto text-center">
        <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Connect Your Wallet
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Connect your Solana wallet to view your account details and manage your voting activities.
          </p>
          <div className="pt-6">
            <WalletButton />
          </div>
        </div>
      </div>
    </section>
  )
}

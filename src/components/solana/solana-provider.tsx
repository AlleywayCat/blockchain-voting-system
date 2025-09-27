'use client'

import dynamic from 'next/dynamic'
import { AnchorProvider } from '@coral-xyz/anchor'
import { WalletError } from '@solana/wallet-adapter-base'
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { ReactNode, useCallback, useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'

// CSS imported in globals.css to avoid HMR issues

export const WalletButton = dynamic(async () => {
  const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui')
  console.log('🔌 WalletMultiButton imported successfully')
  return WalletMultiButton
}, {
  ssr: false,
  loading: () => <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
})

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])

  const onError = useCallback((error: WalletError) => {
    console.error('🔴 Wallet Error:', error)
    console.error('🔴 Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
  }, [])

  // Debug logging
  console.log('🔌 SolanaProvider initialized with endpoint:', endpoint)
  console.log('💰 Using empty wallets array for auto-detection')

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export function useAnchorProvider() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return new AnchorProvider(connection, wallet as AnchorWallet, { commitment: 'confirmed' })
}

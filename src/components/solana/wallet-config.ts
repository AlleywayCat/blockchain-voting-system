'use client'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import type { Adapter } from '@solana/wallet-adapter-base'

/**
 * Get wallet adapters suitable for the Solana wallet adapter
 * This function must be called from the client-side
 * 
 * Note: Modern wallets supporting the Wallet Standard will be detected automatically.
 * This function provides legacy wallet adapters for broader compatibility.
 */
export async function getWalletAdapters(): Promise<Adapter[]> {
  // Check if we're running in the browser
  if (typeof window === 'undefined') {
    console.warn('getWalletAdapters called on server side, returning empty array');
    return [];
  }

  try {
    // Always use devnet for testing purposes
    const network = WalletAdapterNetwork.Devnet;
    console.log('🔌 Configuring wallet adapters for network:', network);
    
    const adapters: Adapter[] = [];
    
    // Import and initialize wallet adapters with individual error handling
    const walletConfigs = [
      {
        name: 'Phantom',
        import: () => import('@solana/wallet-adapter-phantom'),
        create: (walletModule: any) => new walletModule.PhantomWalletAdapter(),
      },
      {
        name: 'Solflare', 
        import: () => import('@solana/wallet-adapter-solflare'),
        create: (walletModule: any) => new walletModule.SolflareWalletAdapter({ network }),
      },
      {
        name: 'Torus',
        import: () => import('@solana/wallet-adapter-torus'),
        create: (walletModule: any) => new walletModule.TorusWalletAdapter({ params: { network } }),
      },
      {
        name: 'Ledger',
        import: () => import('@solana/wallet-adapter-ledger'),
        create: (walletModule: any) => new walletModule.LedgerWalletAdapter(),
      },
    ];

    // Initialize each wallet adapter
    for (const config of walletConfigs) {
      try {
        console.log(`📦 Loading ${config.name} wallet adapter...`);
        const walletModule = await config.import();
        const adapter = config.create(walletModule);
        adapters.push(adapter);
        console.log(`✅ Successfully added ${config.name}WalletAdapter`);
      } catch (error) {
        console.warn(`⚠️  Failed to initialize ${config.name}WalletAdapter:`, error);
      }
    }
    
    if (adapters.length === 0) {
      console.warn('⚠️  No legacy wallet adapters could be initialized. Relying on Wallet Standard auto-detection.');
    } else {
      console.log(`🎉 Successfully initialized ${adapters.length} legacy wallet adapters for ${network}`);
      console.log('💡 Note: Modern wallets supporting Wallet Standard will also be detected automatically');
    }
    
    return adapters;
  } catch (error) {
    console.error('❌ Error initializing wallet adapters:', error);
    console.log('🔄 Falling back to auto-detection only');
    return [];
  }
} 
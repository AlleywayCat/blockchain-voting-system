import { FC, ReactNode, useMemo, useEffect } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SolflareWalletAdapter, PhantomWalletAdapter, TorusWalletAdapter } from "@solana/wallet-adapter-wallets";
import { SOLANA_RPC_URL } from '@/lib/solana-config';

// Default styles
require("@solana/wallet-adapter-react-ui/styles.css");

interface WalletProviderAdapterProps {
  children: ReactNode;
}

export const WalletProviderAdapter: FC<WalletProviderAdapterProps> = ({ children }) => {
  // ALWAYS use Devnet for testing - hardcoded to prevent network mismatch
  const network = WalletAdapterNetwork.Devnet;
  
  // Get custom RPC URL from centralized config
  const endpoint = useMemo(() => {
    console.log("Wallet Adapter: Using Solana RPC URL:", SOLANA_RPC_URL);
    console.log("Wallet Adapter: Network explicitly set to:", network);
    return SOLANA_RPC_URL;
  }, [network]);

  // Log configuration on component mount
  useEffect(() => {
    console.log("WalletProviderAdapter initialized with:");
    console.log("- Network:", network);
    console.log("- Endpoint:", endpoint);
    console.log("- Using centralized config RPC URL:", SOLANA_RPC_URL);
  }, [network, endpoint]);

  // Initialize wallets with explicit network parameter
  const wallets = useMemo(
    () => {
      console.log("Initializing wallet adapters for network:", network);
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter({ network }),
        new TorusWalletAdapter({ params: { network } })
      ];
    },
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}; 
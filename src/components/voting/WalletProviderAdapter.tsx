import { FC, ReactNode, useMemo, useEffect } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SolflareWalletAdapter, PhantomWalletAdapter, TorusWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles
require("@solana/wallet-adapter-react-ui/styles.css");

interface WalletProviderAdapterProps {
  children: ReactNode;
}

export const WalletProviderAdapter: FC<WalletProviderAdapterProps> = ({ children }) => {
  // ALWAYS use Devnet for testing - hardcoded to prevent network mismatch
  const network = WalletAdapterNetwork.Devnet;
  
  // Get custom RPC URL from environment or fall back to Solana devnet
  const endpoint = useMemo(() => {
    // Always prefer the environment variable if available
    const url = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=28bfff14-4e1a-447d-ba02-2b8bf09c1dc1';
    console.log("Wallet Adapter: Using Solana RPC URL:", url);
    console.log("Wallet Adapter: Network explicitly set to:", network);
    return url;
  }, [network]);

  // Log configuration on component mount
  useEffect(() => {
    console.log("WalletProviderAdapter initialized with:");
    console.log("- Network:", network);
    console.log("- Endpoint:", endpoint);
    console.log("- Environment RPC URL:", process.env.NEXT_PUBLIC_SOLANA_RPC_URL);
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
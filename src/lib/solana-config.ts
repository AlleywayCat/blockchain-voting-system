/**
 * Centralized Solana configuration
 * Contains RPC URLs, program IDs, and other Solana-related constants
 */

// Solana RPC URL configuration
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Program ID configuration
export const PROGRAM_ID_STRING = process.env.NEXT_PUBLIC_PROGRAM_ID!;

// Network configuration
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

// Connection commitment level
export const COMMITMENT_LEVEL = 'confirmed' as const;
// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import VotingsystemdappIDL from '../target/idl/votingsystemdapp.json'
import type { Votingsystemdapp } from '../target/types/votingsystemdapp'

// Re-export the generated IDL and type
export { Votingsystemdapp, VotingsystemdappIDL }

// The programId is imported from the program IDL.
export const VOTINGSYSTEMDAPP_PROGRAM_ID = new PublicKey(VotingsystemdappIDL.address)

// This is a helper function to get the Votingsystemdapp Anchor program.
export function getVotingsystemdappProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...VotingsystemdappIDL, address: address ? address.toBase58() : VotingsystemdappIDL.address } as Votingsystemdapp, provider)
}

// This is a helper function to get the program ID for the Votingsystemdapp program depending on the cluster.
export function getVotingsystemdappProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Votingsystemdapp program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return VOTINGSYSTEMDAPP_PROGRAM_ID
  }
}

'use client'

import { IDL } from '@/generated/votingsystemdapp-idl-simple'
import { Program } from '@coral-xyz/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { BN } from '@coral-xyz/anchor'

export function useVotingsystemdappProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => {
    const PROGRAM_ID_STRING = process.env.NEXT_PUBLIC_PROGRAM_ID || "CfU2hH8HEy6UQhiEeECeJL66112N18EuYq1khpX2N1RF";
    return new PublicKey(PROGRAM_ID_STRING);
  }, [])
  
  const program = useMemo(() => {
    try {
      return new Program(IDL as any, provider);
    } catch (error) {
      console.error('Failed to create program:', error);
      return null;
    }
  }, [provider])

  const accounts = useQuery({
    queryKey: ['poll', 'all', { cluster }],
    queryFn: () => (program as any)?.account?.poll?.all() || Promise.resolve([]),
    enabled: !!program,
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['votingsystemdapp', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) => {
      if (!program) {
        throw new Error('Program not initialized');
      }
      
      const startTime = new BN(Math.floor(Date.now()/1000));
      const endTime = new BN(Math.floor(Date.now()/1000) + 86400);
      
      return (program as any).methods
        .createPoll("New Poll", "Description", ["Option 1", "Option 2"], startTime, endTime, true)
        .accountsStrict({ 
          creator: provider.wallet.publicKey, 
          poll: keypair.publicKey,
          systemProgram: SystemProgram.programId 
        })
        .signers([keypair])
        .rpc();
    },
    onSuccess: (signature: string) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useVotingsystemdappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useVotingsystemdappProgram()

  const accountQuery = useQuery({
    queryKey: ['poll', 'fetch', { cluster, account }],
    queryFn: () => (program as any)?.account?.poll?.fetch(account) || Promise.resolve(null),
    enabled: !!program,
  })

  const closeMutation = useMutation({
    mutationKey: ['votingsystemdapp', 'closePoll', { cluster, account }],
    mutationFn: () => {
      if (!program) {
        throw new Error('Program not initialized');
      }
      return (program as any).methods.closePoll()
        .accountsStrict({ 
          authority: (program as any).provider.publicKey,
          poll: account 
        })
        .rpc();
    },
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
  }
}

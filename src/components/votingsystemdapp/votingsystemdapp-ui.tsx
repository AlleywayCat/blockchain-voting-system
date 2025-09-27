'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVotingsystemdappProgram, useVotingsystemdappProgramAccount } from './votingsystemdapp-data-access'
import { Button } from '../ui/button'
import { RefreshCw } from 'lucide-react'
import { useConfirmationDialog } from '../ui/confirmation-dialog'

export function VotingsystemdappCreate() {
  const { initialize } = useVotingsystemdappProgram()

  return (
    <Button
      onClick={() => initialize.mutateAsync(Keypair.generate())}
      disabled={initialize.isPending}
    >
      {initialize.isPending ? (
        <>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Creating...
        </>
      ) : (
        'Create New Account'
      )}
    </Button>
  )
}

export function VotingsystemdappList() {
  const { accounts, getProgramAccount } = useVotingsystemdappProgram()

  if (getProgramAccount.isLoading) {
    return <RefreshCw className="h-8 w-8 animate-spin text-primary" />
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="bg-error/10 dark:bg-error/5 border border-error/20 dark:border-error/10 rounded-lg p-6 text-center">
        <p className="text-error dark:text-error/90">
          Program account not found. Make sure you have deployed the program and are on the correct cluster.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {accounts.isLoading ? (
        <div className="flex justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-6">
          {accounts.data?.map((account: { publicKey: PublicKey }) => (
            <VotingsystemdappCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-main dark:text-main mb-2">No Accounts Found</h2>
          <p className="text-secondary dark:text-secondary mb-6">
            Create a new account above to get started with the voting program.
          </p>
        </div>
      )}
    </div>
  )
}

function VotingsystemdappCard({ account }: { account: PublicKey }) {
  const { accountQuery, closeMutation } = useVotingsystemdappProgramAccount({
    account,
  })

  const pollData = useMemo(() => accountQuery.data || null, [accountQuery.data])
  const { openDialog: openCloseDialog, ConfirmationDialog: CloseConfirmationDialog } = useConfirmationDialog()

  const handleCloseAccount = () => {
    openCloseDialog(
      {
        title: "Close Account",
        description: "Are you sure you want to close this account? This action cannot be undone and will permanently delete the account data.",
        confirmText: "Close Account",
        cancelText: "Cancel",
        variant: "destructive",
        icon: "warning",
        isLoading: closeMutation.isPending,
      },
      () => closeMutation.mutateAsync()
    );
  };

  return accountQuery.isLoading ? (
    <div className="flex justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  ) : (
    <div className="card-modern p-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Poll Data</h3>
          {pollData ? (
            <div className="text-sm">
              <p><strong>Name:</strong> {pollData.name}</p>
              <p><strong>Description:</strong> {pollData.description}</p>
              <p><strong>Active:</strong> {pollData.isActive ? 'Yes' : 'No'}</p>
            </div>
          ) : (
            <p className="text-gray-500">No poll data found</p>
          )}
        </div>
        <div className="text-center space-y-4 border-t border-main dark:border-main pt-4 w-full">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 w-full">
            <p className="text-sm text-secondary dark:text-secondary mb-1">Account Address</p>
            <ExplorerLink 
              path={`account/${account}`} 
              label={ellipsify(account.toString())} 
              className="text-primary hover:text-primary-dark font-mono text-sm transition-colors"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCloseAccount}
            disabled={closeMutation.isPending}
          >
            {closeMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Close Account
          </Button>
        </div>
      </div>
      <CloseConfirmationDialog />
    </div>
  )
}

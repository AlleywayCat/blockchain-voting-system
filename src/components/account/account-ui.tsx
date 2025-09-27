'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { IconRefresh } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { AppModal, ellipsify } from '../ui/ui-layout'
import { useCluster } from '../cluster/cluster-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { RefreshCw } from 'lucide-react'
import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
} from './account-data-access'

export function AccountBalance({ address }: { address: PublicKey }) {
  const query = useGetBalance({ address })

  return (
    <div>
      <h1 className="text-5xl font-bold cursor-pointer" onClick={() => query.refetch()}>
        {query.data ? <BalanceSol balance={query.data} /> : '...'} SOL
      </h1>
    </div>
  )
}
export function AccountChecker() {
  const { publicKey } = useWallet()
  if (!publicKey) {
    return null
  }
  return <AccountBalanceCheck address={publicKey} />
}
export function AccountBalanceCheck({ address }: { address: PublicKey }) {
  const { cluster } = useCluster()
  const mutation = useRequestAirdrop({ address })
  const query = useGetBalance({ address })

  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 rounded-none">
        <AlertDescription className="flex items-center justify-center gap-4">
          <span>
            You are connected to <strong>{cluster.name}</strong> but your account is not found on this cluster.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => mutation.mutateAsync(1).catch((err) => console.log(err))}
          >
            Request Airdrop
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  return null
}

export function AccountButtons({ address }: { address: PublicKey }) {
  const wallet = useWallet()
  const { cluster } = useCluster()
  const [showAirdropModal, setShowAirdropModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  return (
    <div>
      <ModalAirdrop hide={() => setShowAirdropModal(false)} address={address} show={showAirdropModal} />
      <ModalReceive address={address} show={showReceiveModal} hide={() => setShowReceiveModal(false)} />
      <ModalSend address={address} show={showSendModal} hide={() => setShowSendModal(false)} />
      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          disabled={cluster.network?.includes('mainnet')}
          onClick={() => setShowAirdropModal(true)}
        >
          Airdrop
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={wallet.publicKey?.toString() !== address.toString()}
          onClick={() => setShowSendModal(true)}
        >
          Send
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReceiveModal(true)}
        >
          Receive
        </Button>
      </div>
    </div>
  )
}

export function AccountTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false)
  const query = useGetTokenAccounts({ address })
  const client = useQueryClient()
  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Token Accounts</h2>
        <div className="flex items-center space-x-2">
          {query.isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await query.refetch()
                await client.invalidateQueries({
                  queryKey: ['getTokenAccountBalance'],
                })
              }}
            >
              <IconRefresh size={16} />
            </Button>
          )}
        </div>
      </div>
      {query.isError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Error: {query.error?.message.toString()}
          </AlertDescription>
        </Alert>
      )}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No token accounts found.</div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium">Public Key</th>
                    <th className="text-left p-4 font-medium">Mint</th>
                    <th className="text-right p-4 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map(({ account, pubkey }) => (
                    <tr key={pubkey.toString()} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <span className="font-mono">
                            <ExplorerLink label={ellipsify(pubkey.toString())} path={`account/${pubkey.toString()}`} />
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <span className="font-mono">
                            <ExplorerLink
                              label={ellipsify(account.data.parsed.info.mint)}
                              path={`account/${account.data.parsed.info.mint.toString()}`}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="text-right p-4">
                        <span className="font-mono">{account.data.parsed.info.tokenAmount.uiAmount}</span>
                      </td>
                    </tr>
                  ))}

                  {(query.data?.length ?? 0) > 5 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAll(!showAll)}
                        >
                          {showAll ? 'Show Less' : 'Show All'}
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AccountTransactions({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address })
  const [showAll, setShowAll] = useState(false)

  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="flex items-center space-x-2">
          {query.isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              <IconRefresh size={16} />
            </Button>
          )}
        </div>
      </div>
      {query.isError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Error: {query.error?.message.toString()}
          </AlertDescription>
        </Alert>
      )}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions found.</div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium">Signature</th>
                    <th className="text-right p-4 font-medium">Slot</th>
                    <th className="text-left p-4 font-medium">Block Time</th>
                    <th className="text-right p-4 font-medium">Status</th>
                  </tr>
                </thead>
              <tbody>
                {items?.map((item) => (
                  <tr key={item.signature} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                    <td className="p-4 font-mono">
                      <ExplorerLink path={`tx/${item.signature}`} label={ellipsify(item.signature, 8)} />
                    </td>
                    <td className="p-4 font-mono text-right">
                      <ExplorerLink path={`block/${item.slot}`} label={item.slot.toString()} />
                    </td>
                    <td className="p-4">{new Date((item.blockTime ?? 0) * 1000).toISOString()}</td>
                    <td className="text-right p-4">
                      {item.err ? (
                        <Badge variant="destructive" title={JSON.stringify(item.err)}>
                          Failed
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Success
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Show Less' : 'Show All'}
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BalanceSol({ balance }: { balance: number }) {
  return <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
}

function ModalReceive({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  return (
    <AppModal title="Receive" hide={hide} show={show}>
      <p>Receive assets by sending them to your public key:</p>
      <code>{address.toString()}</code>
    </AppModal>
  )
}

function ModalAirdrop({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  const mutation = useRequestAirdrop({ address })
  const [amount, setAmount] = useState('2')

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Airdrop"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount)).then(() => hide())}
    >
      <Input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  )
}

function ModalSend({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  const wallet = useWallet()
  const mutation = useTransferSol({ address })
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')

  if (!address || !wallet.sendTransaction) {
    return <div>Wallet not connected</div>
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Send"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={() => {
        mutation
          .mutateAsync({
            destination: new PublicKey(destination),
            amount: parseFloat(amount),
          })
          .then(() => hide())
      }}
    >
      <div className="space-y-4">
        <Input
          disabled={mutation.isPending}
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <Input
          disabled={mutation.isPending}
          type="number"
          step="any"
          min="1"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
    </AppModal>
  )
}

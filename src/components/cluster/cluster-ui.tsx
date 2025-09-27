'use client'

import { useConnection } from '@solana/wallet-adapter-react'
import { IconTrash } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { AppModal } from '../ui/ui-layout'
import { ClusterNetwork, useCluster } from './cluster-data-access'
import { Connection } from '@solana/web3.js'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { RefreshCw, ChevronDown, ExternalLink, Plus, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useConfirmationDialog } from '../ui/confirmation-dialog'

export function ExplorerLink({ path, label, className }: { path: string; label: string; className?: string }) {
  const { getExplorerUrl } = useCluster()
  return (
    <a
      href={getExplorerUrl(path)}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-mono`}
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

export function ClusterChecker({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const { connection } = useConnection()

  const query = useQuery({
    queryKey: ['version', { cluster, endpoint: connection.rpcEndpoint }],
    queryFn: () => connection.getVersion(),
    retry: 1,
  })
  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 rounded-none">
        <AlertDescription className="flex items-center justify-center gap-4">
          <span>
            Error connecting to cluster <strong>{cluster.name}</strong>
          </span>
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  return children
}

export function ClusterUiSelect() {
  const { clusters, setCluster, cluster } = useCluster()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {cluster.name}
          <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 min-w-0">
        {clusters.map((item) => (
          <DropdownMenuItem
            key={item.name}
            onClick={() => setCluster(item)}
            className={`cursor-pointer text-sm ${item.active ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{item.name}</span>
              {item.active && (
                <div className="h-2 w-2 rounded-full bg-primary ml-2 flex-shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ClusterUiModal({ hideModal, show }: { hideModal: () => void; show: boolean }) {
  const { addCluster } = useCluster()
  const [name, setName] = useState('')
  const [network, setNetwork] = useState<ClusterNetwork | undefined>()
  const [endpoint, setEndpoint] = useState('')

  return (
    <AppModal
      title={'Add Cluster'}
      hide={hideModal}
      show={show}
      submit={() => {
        try {
          new Connection(endpoint)
          if (name) {
            addCluster({ name, network, endpoint })
            hideModal()
          } else {
            console.log('Invalid cluster name')
          }
        } catch {
          console.log('Invalid cluster endpoint')
        }
      }}
      submitLabel="Save"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cluster-name">Cluster Name</Label>
          <Input
            id="cluster-name"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rpc-endpoint">RPC Endpoint</Label>
          <Input
            id="rpc-endpoint"
            type="text"
            placeholder="Endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="network">Network</Label>
          <select
            id="network"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={network || ''}
            onChange={(e) => setNetwork(e.target.value as ClusterNetwork)}
          >
            <option value="">Select a network</option>
            <option value={ClusterNetwork.Devnet}>Devnet</option>
            <option value={ClusterNetwork.Testnet}>Testnet</option>
            <option value={ClusterNetwork.Mainnet}>Mainnet</option>
          </select>
        </div>
      </div>
    </AppModal>
  )
}

export function ClusterUiTable() {
  const { clusters, setCluster, deleteCluster } = useCluster()
  const { openDialog: openDeleteDialog, ConfirmationDialog: DeleteConfirmationDialog } = useConfirmationDialog()

  const handleDeleteCluster = (cluster: any) => {
    openDeleteDialog(
      {
        title: "Delete Cluster",
        description: `Are you sure you want to delete the cluster "${cluster.name}"? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        variant: "destructive",
        icon: "delete",
      },
      () => deleteCluster(cluster)
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium">Name / Network / Endpoint</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((item) => (
                <tr key={item.name} className={`border-b border-border last:border-b-0 ${item?.active ? 'bg-muted/30' : 'hover:bg-muted/20'}`}>
                  <td className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">
                        {item?.active ? (
                          <span className="flex items-center gap-2">
                            {item.name}
                            <Badge variant="default" className="text-xs">Active</Badge>
                          </span>
                        ) : (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-lg font-medium text-primary hover:text-primary/80"
                            title="Select cluster"
                            onClick={() => setCluster(item)}
                          >
                            {item.name}
                          </Button>
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Network: <Badge variant="outline" className="text-xs">{item.network ?? 'custom'}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{item.endpoint}</div>
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={item?.active}
                      onClick={() => handleDeleteCluster(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      <DeleteConfirmationDialog />
    </Card>
  )
}

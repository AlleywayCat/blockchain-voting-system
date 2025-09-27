'use client'

import { useState } from 'react'
import { AppHero } from '../ui/ui-layout'
import { ClusterUiModal } from './cluster-ui'
import { ClusterUiTable } from './cluster-ui'
import { Button } from '../ui/button'
import { Plus } from 'lucide-react'

export default function ClusterFeature() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <AppHero title="Clusters" subtitle="Manage and select your Solana clusters">
        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={() => setShowModal(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Cluster
          </Button>
        </div>
        <ClusterUiModal show={showModal} hideModal={() => setShowModal(false)} />
      </AppHero>
      <div className="container mx-auto py-8">
        <ClusterUiTable />
      </div>
    </div>
  )
}

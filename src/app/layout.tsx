import './globals.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import { ClusterProvider } from '@/components/cluster/cluster-data-access'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { UiLayout } from '@/components/ui/ui-layout'
import { ReactQueryProvider } from './react-query-provider'

export const metadata = {
  title: 'Decentralized Voting',
  description: 'Transparent, secure, and tamper-proof voting powered by blockchain technology',
}

const links: { label: string; path: string }[] = [
  { label: 'Home', path: '/' },
  { label: 'Browse Polls', path: '/polls' },
  { label: 'Create Poll', path: '/create-poll' },
  { label: 'Account', path: '/account' },
  { label: 'Clusters', path: '/clusters' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <ClusterProvider>
            <SolanaProvider>
              <UiLayout links={links}>{children}</UiLayout>
            </SolanaProvider>
          </ClusterProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { ReactNode, Suspense, useEffect, useRef } from 'react'
import toast, { Toaster } from 'react-hot-toast'

import { AccountChecker } from '../account/account-ui'
import { ClusterChecker, ClusterUiSelect, ExplorerLink } from '../cluster/cluster-ui'
import { WalletButton } from '../solana/solana-provider'
import { Button } from './button'
import { Separator } from './separator'

export function UiLayout({ children, links }: { children: ReactNode; links: { label: string; path: string }[] }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Apple-inspired Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and brand */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <span className="text-lg font-semibold tracking-tight">Decentralized Voting</span>
            </Link>
            
            {/* Navigation Links - Apple-style minimal */}
            <div className="hidden md:flex items-center space-x-1">
              {links.map(({ label, path }) => (
                <Link key={path} href={path}>
                  <Button
                    variant={pathname === path || (path !== '/' && pathname.startsWith(path)) ? "secondary" : "ghost"}
                    size="sm"
                    className="h-9 text-sm font-medium"
                  >
                    {label}
                  </Button>
                </Link>
              ))}
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              <ClusterUiSelect />
              <div className="h-6 w-px bg-border" />
              <WalletButton />
            </div>
          </div>
        </div>
      </nav>
      <ClusterChecker>
        <AccountChecker />
      </ClusterChecker>
      {/* Main Content */}
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      
      {/* Apple-inspired Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Decentralized Voting</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Powered by{' '}
              <a 
                className="text-primary hover:underline font-medium" 
                href="https://solana.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Solana
              </a>
              {' • '}
              Built by Nikola Lausev
            </p>
          </div>
        </div>
      </footer>
      <Toaster position="bottom-right" />
    </div>
  )
}

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
}: {
  children: ReactNode
  title: string
  hide: () => void
  show: boolean
  submit?: () => void
  submitDisabled?: boolean
  submitLabel?: string
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    if (!dialogRef.current) return
    if (show) {
      dialogRef.current.showModal()
    } else {
      dialogRef.current.close()
    }
  }, [show, dialogRef])

  return (
    <>
      <dialog 
        className="fixed inset-0 z-50 bg-transparent m-0 p-0 max-w-none max-h-none w-full h-full" 
        ref={dialogRef}
        onCancel={hide}
      >
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">{title}</h3>
              <div className="py-4">
                {children}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                {submit ? (
                  <Button
                    onClick={submit}
                    disabled={submitDisabled}
                    variant="default"
                    size="sm"
                  >
                    {submitLabel || 'Save'}
                  </Button>
                ) : null}
                <Button
                  onClick={hide}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode
  title: ReactNode
  subtitle: ReactNode
}) {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="container mx-auto text-center">
        <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
          {typeof title === 'string' ? (
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              {title}
            </h1>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <p className="text-xl text-muted-foreground sm:text-2xl lg:text-xl">
              {subtitle}
            </p>
          ) : (
            subtitle
          )}
          {children}
        </div>
      </div>
    </section>
  )
}

export function ellipsify(str = '', len = 4) {
  if (str.length > 30) {
    return str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
  }
  return str
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className={'text-center'}>
        <div className="text-sm font-medium">Transaction sent</div>
        <ExplorerLink 
          path={`tx/${signature}`} 
          label={'View Transaction'} 
          className="inline-block mt-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-md hover:bg-primary/90 transition-colors" 
        />
      </div>,
    )
  }
}

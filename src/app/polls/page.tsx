'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { AppHero } from '@/components/ui/ui-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PollList } from '@/components/voting/PollList'
import { WalletButton } from '@/components/solana/solana-provider'
import { VotingClient, PollData } from '@/components/voting/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PollsPage() {
  const { connection } = useConnection()
  const wallet = useWallet()

  // Use React Query for caching and automatic refetching
  const { data: polls = [], isLoading: loading, error } = useQuery({
    queryKey: ['polls'],
    queryFn: async (): Promise<PollData[]> => {
      const response = await fetch('/api/polls')
      if (!response.ok) {
        throw new Error('Failed to fetch polls')
      }
      
      const data = await response.json()
      if (data.success && data.polls) {
        // Transform API data to match PollData interface
        return data.polls.map((poll: any) => ({
          address: { toString: () => poll.address },
          name: poll.name,
          description: poll.description,
          options: poll.options.map((opt: any) => ({
            text: opt.text,
            voteCount: opt.voteCount
          })),
          startTime: poll.startTime,
          endTime: poll.endTime,
          isPublic: poll.isPublic,
          isActive: poll.isActive,
          creator: { toString: () => poll.creator },
          totalVotes: poll.totalVotes
        }))
      }
      return []
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce RPC calls
  })

  // Show error toast if query fails
  React.useEffect(() => {
    if (error) {
      console.error("Error fetching polls:", error)
      toast.error("Failed to load polls")
    }
  }, [error])

  // Helper function to format timestamp to date string
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  // Filter active and completed polls
  const activePolls = polls.filter(poll => {
    const now = Math.floor(Date.now() / 1000)
    const isTimeActive = now >= poll.startTime && now <= poll.endTime
    return poll.isActive && isTimeActive
  })

  const completedPolls = polls.filter(poll => {
    const now = Math.floor(Date.now() / 1000)
    return !poll.isActive || now > poll.endTime
  })

  return (
    <>
      <AppHero
        title="Decentralized Polls"
        subtitle="Browse, vote, and create transparent blockchain-based polls"
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Active Polls</h2>
            <p className="text-muted-foreground mt-1">
              Vote on currently active polls
            </p>
          </div>
          <Link href="/create-poll">
            <Button size="lg" className="mt-4 sm:mt-0">
              Create New Poll
            </Button>
          </Link>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[1, 2].map((index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Wallet Not Connected */}
        {!loading && !wallet.connected && (
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to view active polls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletButton />
            </CardContent>
          </Card>
        )}
        
        {/* Active Polls */}
        {!loading && wallet.connected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {activePolls.length > 0 ? (
              activePolls.map(poll => (
                <Link key={poll.address.toString()} href={`/polls/${poll.address.toString()}`}>
                  <Card className="group hover:shadow-lg transition-shadow duration-200 h-full">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{poll.name}</CardTitle>
                        <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                          Active
                        </Badge>
                      </div>
                      <CardDescription className="leading-relaxed">
                        {poll.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {poll.options.map((option, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {option.text}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>By: {poll.creator.toString().slice(0, 4)}...{poll.creator.toString().slice(-4)}</span>
                        <span>Ends: {formatDate(poll.endTime)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-2">
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No active polls available.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
        
        {/* Completed Polls Section */}
        {!loading && wallet.connected && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Completed Polls</h2>
              <p className="text-muted-foreground mt-1">
                View results of past polls
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedPolls.length > 0 ? (
                completedPolls.map(poll => (
                  <Link key={poll.address.toString()} href={`/polls/${poll.address.toString()}`}>
                    <Card className="group hover:shadow-lg transition-shadow duration-200 h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{poll.name}</CardTitle>
                          <Badge variant="outline">
                            Completed
                          </Badge>
                        </div>
                        <CardDescription className="leading-relaxed">
                          {poll.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {poll.options.map((option, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {option.text}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>By: {poll.creator.toString().slice(0, 4)}...{poll.creator.toString().slice(-4)}</span>
                          <span>{poll.totalVotes} votes</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="col-span-2">
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No completed polls available.</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
} 
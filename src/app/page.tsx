import { AppHero } from '@/components/ui/ui-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Vote, Plus, Shield, Eye, Users } from 'lucide-react'
import Link from 'next/link'

export default function Page() {
  return (
    <div>
      <AppHero
        title="Decentralized Voting"
        subtitle="Experience transparent, secure, and tamper-proof voting powered by blockchain technology."
      />

      {/* Main Actions Section */}
      <section className="py-24">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Browse Polls Card */}
            <Card className="group hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Vote className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Browse Polls</h3>
                    <Badge variant="secondary" className="mt-1">Active Voting</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Explore active polls and cast your vote on topics that matter to you. 
                  Join the community in making important decisions through transparent voting.
                </p>
                <Link href="/polls">
                  <Button className="w-full group-hover:bg-primary/90 transition-colors">
                    View All Polls
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Create Poll Card */}
            <Card className="group hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Create Poll</h3>
                    <Badge variant="outline" className="mt-1">Start Voting</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Start your own poll and gather opinions from the community. 
                  Create both public and private polls with customizable options.
                </p>
                <Link href="/create-poll">
                  <Button variant="outline" className="w-full group-hover:bg-muted transition-colors">
                    Create New Poll
                    <Plus className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Why Decentralized Voting?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built on blockchain technology to ensure trust, transparency, and security in every vote.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Transparent</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every vote is publicly verifiable on the blockchain, ensuring complete transparency in the democratic process.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Immutable</h3>
              <p className="text-muted-foreground leading-relaxed">
                Once cast, votes cannot be altered or deleted, providing permanent and tamper-proof records.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Accessible</h3>
              <p className="text-muted-foreground leading-relaxed">
                Participate from anywhere with an internet connection, removing geographical barriers to democratic participation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

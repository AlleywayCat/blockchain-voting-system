"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePoll } from "@/components/voting/CreatePoll";
import { PollList } from "@/components/voting/PollList";
import { useSearchParams } from "next/navigation";
import React, { ReactNode } from 'react';
import { Card } from "@/components/ui/card";

// Modern, minimalist section component
interface SectionProps {
  children: ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({ children, className = "" }) => (
  <div className={`rounded-2xl border-0 overflow-hidden backdrop-blur-md bg-white/[0.65] dark:bg-[#1c1c1e]/[0.65] shadow-sm mb-20 ${className}`}>
    {children}
  </div>
);

export default function VotingSystemPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const defaultTab = tabParam === 'create' ? 'create' : 'polls';

  return (
    <div className="flex flex-col items-center w-full">
      <section className="relative py-24 lg:py-32 w-full">
        <div className="container mx-auto text-center">
          <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Decentralized Voting
            </h1>
            <p className="text-xl text-muted-foreground sm:text-2xl lg:text-xl">
              A secure, transparent and tamper-proof voting platform built on Solana blockchain
            </p>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[960px] px-4">
        {/* First section: Tabs for navigation */}
        <Section className="w-full">
          <Tabs defaultValue={defaultTab} className="w-full flex flex-col items-center">
            {/* Tabs content */}
            <div className="p-8 w-full flex flex-col items-center">
              {/* Tab navigation directly above content */}
              <div className="flex justify-center mb-8 w-full">
                <TabsList className="grid grid-cols-2 gap-3 w-[400px]">
                  <TabsTrigger value="polls" className="w-full flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" x2="21" y1="6" y2="6" />
                      <line x1="8" x2="21" y1="12" y2="12" />
                      <line x1="8" x2="21" y1="18" y2="18" />
                      <line x1="3" x2="3" y1="6" y2="6" />
                      <line x1="3" x2="3" y1="12" y2="12" />
                      <line x1="3" x2="3" y1="18" y2="18" />
                    </svg>
                    View Polls
                  </TabsTrigger>
                  <TabsTrigger value="create" className="w-full flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12h8" />
                      <path d="M12 8v8" />
                    </svg>
                    Create Poll
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="polls" className="mt-0 w-full flex justify-center">
                <div className="w-full max-w-3xl animate-fade-in">
                  <Card>
                    <div className="p-7 border-b border-[#e8e8ed] dark:border-[#3a3a3c]">
                      <h3 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">Available Polls</h3>
                      <p className="text-[#6e6e73] dark:text-[#86868b] mt-2">
                        Browse and vote on available polls. Results are updated in real-time.
                      </p>
                    </div>
                    <div className="p-7">
                      <PollList />
                    </div>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="create" className="mt-0 w-full flex justify-center">
                <div className="w-full max-w-3xl animate-fade-in">
                  <CreatePoll />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Section>
        
        {/* Second section: How It Works */}
        <Section className="w-full">
          <div className="px-8 pt-12 pb-14">
            <div className="text-center mb-16">
              <span className="inline-block text-[#0066cc] dark:text-[#2997ff] font-medium mb-3">Our Process</span>
              <h2 className="text-[40px] font-semibold text-[#1d1d1f] dark:text-white mb-5 tracking-tight">
                How It Works
              </h2>
              <p className="text-[21px] text-[#6e6e73] dark:text-[#86868b] max-w-2xl mx-auto">
                Our decentralized voting system makes creating and participating in polls simple, secure, and transparent.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10">
              {/* Feature 1 */}
              <div>
                <Card className="h-full border hover:shadow-lg transition-shadow duration-200">
                  <div className="p-8">
                    <div className="mb-5 w-14 h-14 rounded-xl flex items-center justify-center bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#0066cc] dark:text-[#2997ff]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-[#1d1d1f] dark:text-white mb-3 tracking-tight">Secure & Transparent</h3>
                    <p className="text-[#6e6e73] dark:text-[#86868b] leading-relaxed">
                      All votes are securely recorded on the Solana blockchain, ensuring 
                      transparency and preventing tampering. The entire voting process is 
                      verifiable and auditable.
                    </p>
                  </div>
                </Card>
              </div>
              
              {/* Feature 2 */}
              <div>
                <Card className="h-full border hover:shadow-lg transition-shadow duration-200">
                  <div className="p-8">
                    <div className="mb-5 w-14 h-14 rounded-xl flex items-center justify-center bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#0066cc] dark:text-[#2997ff]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m8 2 4 4 4-4" />
                        <path d="M12 6v10.5" />
                        <path d="M4 10c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-[#1d1d1f] dark:text-white mb-3 tracking-tight">Easy to Use</h3>
                    <p className="text-[#6e6e73] dark:text-[#86868b] leading-relaxed">
                      Creating and participating in polls is straightforward. Simply connect 
                      your wallet, create a poll or browse existing ones, and cast your vote
                      with a single click.
                    </p>
                  </div>
                </Card>
              </div>
              
              {/* Feature 3 */}
              <div>
                <Card className="h-full border hover:shadow-lg transition-shadow duration-200">
                  <div className="p-8">
                    <div className="mb-5 w-14 h-14 rounded-xl flex items-center justify-center bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#0066cc] dark:text-[#2997ff]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-[#1d1d1f] dark:text-white mb-3 tracking-tight">Flexible Settings</h3>
                    <p className="text-[#6e6e73] dark:text-[#86868b] leading-relaxed">
                      Create both public and private polls. Public polls are open to everyone,
                      while private polls require voter registration, giving you control over
                      who can participate.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
} 
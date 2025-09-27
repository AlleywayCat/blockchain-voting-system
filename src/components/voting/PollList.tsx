"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { VotingClient, PollData } from "./client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";

// Simple rate limiter for API calls
const rateLimiter = {
  lastCallTime: 0,
  minInterval: 2000, // 2 seconds minimum between calls
  
  async fetchWithLimit(url: string, options?: RequestInit) {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    // If we've made a call recently, wait before making another
    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall;
      console.log(`Rate limiting API call, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Update last call time
    this.lastCallTime = Date.now();
    
    // Make the actual fetch call
    return fetch(url, options);
  }
};

export function PollList() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const [polls, setPolls] = useState<PollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolls = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching polls from API with rate limiting");
        let retryCount = 0;
        const maxRetries = 3;
        
        // Try a few times with exponential backoff
        while (retryCount <= maxRetries) {
          try {
            // Use rate-limited fetch
            const response = await rateLimiter.fetchWithLimit('/api/polls');
            
            if (!response.ok) {
              // If we get a 429, retry with backoff
              if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * Math.pow(2, retryCount);
                console.log(`Rate limited (429). Retrying in ${waitTime}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retryCount++;
                continue;
              }
              
              // For other errors, throw
              throw new Error(`Server responded with status: ${response.status}`);
            }
            
            // Parse the response
            const data = await response.json();
            
            if (!data.success) {
              throw new Error(data.error || 'Unknown API error');
            }
            
            // Transform the data into the expected format
            const transformedPolls = data.polls.map((poll: any) => ({
              name: poll.name,
              description: poll.description,
              options: poll.options.map((option: string, index: number) => ({
                text: option,
                voteCount: poll.votes?.[option] || 0
              })),
              startTime: poll.startTime,
              endTime: poll.endTime,
              isPublic: poll.isPublic,
              isActive: Date.now() / 1000 < poll.endTime,
              totalVotes: Object.values(poll.votes || {}).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0),
              creator: new PublicKey(poll.creator),
              address: new PublicKey(poll.address === 'example' ? '11111111111111111111111111111111' : poll.address)
            }));
            
            setPolls(transformedPolls);
            break; // Exit the retry loop on success
          } catch (innerError) {
            if (retryCount < maxRetries) {
              const waitTime = 2000 * Math.pow(2, retryCount);
              console.log(`API error, retrying in ${waitTime}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retryCount++;
            } else {
              throw innerError; // Rethrow after max retries
            }
          }
        }
      } catch (error) {
        console.error("Error fetching polls:", error);
        
        if (error instanceof Error) {
          if (error.message.includes('429')) {
            setError("Too many requests. Please try again later.");
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            setError("Network error. Please check your internet connection.");
          } else {
            setError(`Failed to fetch polls: ${error.message}`);
          }
        } else {
          setError("An unknown error occurred while fetching polls");
        }
      } finally {
        setLoading(false);
      }
    };

    // Call fetchPolls regardless of wallet connection status
    fetchPolls();
  }, []);

  const navigateToPoll = (pollAddress: string) => {
    router.push(`/polls/${pollAddress}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isPollActive = (poll: PollData) => {
    const now = Math.floor(Date.now() / 1000);
    return now >= poll.startTime && now <= poll.endTime;
  };

  const getPollStatus = (poll: PollData) => {
    const now = Math.floor(Date.now() / 1000);
    
    if (now < poll.startTime) {
      return {
        label: "Upcoming",
        variant: "warning"
      };
    } else if (now >= poll.startTime && now <= poll.endTime) {
      return {
        label: "Active",
        variant: "success"
      };
    } else {
      return {
        label: "Ended",
        variant: "default"
      };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((index) => (
          <Card key={index}>
            <CardHeader className="p-6 border-b border-[#e8e8ed] dark:border-[#3a3a3c]">
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <Card>
          <CardHeader className="text-center py-8">
            <div className="w-14 h-14 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl flex items-center justify-center text-red-500 dark:text-red-400 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12" y2="16" />
              </svg>
            </div>
            <CardTitle className="text-xl font-semibold text-[#1d1d1f] dark:text-white mb-2">Error Loading Polls</CardTitle>
            <CardDescription className="max-w-sm mx-auto text-[#6e6e73] dark:text-[#86868b]">
              {error}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-8">
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              size="lg"
              className="min-w-32"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!wallet.connected) {
    return (
      <div className="animate-fade-in">
        <Card>
          <CardHeader className="text-center py-8">
            <div className="w-14 h-14 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl flex items-center justify-center text-[#0066cc] dark:text-[#2997ff] mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <CardTitle className="text-xl font-semibold text-[#1d1d1f] dark:text-white mb-2">Wallet Not Connected</CardTitle>
            <CardDescription className="max-w-sm mx-auto text-[#6e6e73] dark:text-[#86868b]">
              Please connect your wallet to view available polls.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="animate-fade-in">
        <Card>
          <CardHeader className="text-center py-8">
            <div className="w-14 h-14 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl flex items-center justify-center text-[#0066cc] dark:text-[#2997ff] mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
                <path d="M12 8v8" />
              </svg>
            </div>
            <CardTitle className="text-xl font-semibold text-[#1d1d1f] dark:text-white mb-2">No Polls Found</CardTitle>
            <CardDescription className="max-w-sm mx-auto text-[#6e6e73] dark:text-[#86868b]">
              There are currently no polls available. Create a new poll to get started.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-8">
            <a href="/voting?tab=create">
              <Button
                variant="default"
                size="lg"
                className="mt-10 min-w-[200px]"
              >
                Create Your First Poll
              </Button>
            </a>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => {
        const status = getPollStatus(poll);
        
        return (
          <Card 
            key={poll.address.toString()}
            className="w-full"
          >
            <CardHeader className="p-6 border-b border-[#e8e8ed] dark:border-[#3a3a3c]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-[#1d1d1f] dark:text-white">{poll.name}</CardTitle>
                <Badge variant={status.variant as any} className="text-xs rounded-full">{status.label}</Badge>
              </div>
              <CardDescription className="text-[#6e6e73] dark:text-[#86868b] mt-1">
                {poll.isPublic ? "Public Poll" : "Private Poll"} • {poll.totalVotes} votes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="mb-4 text-[#424245] dark:text-[#d1d1d6]">{poll.description}</p>
              <div className="text-sm text-[#6e6e73] dark:text-[#86868b] space-y-2">
                <p className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Start: {formatDate(poll.startTime)}
                </p>
                <p className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  End: {formatDate(poll.endTime)}
                </p>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button
                onClick={() => navigateToPoll(poll.address.toString())}
                variant={isPollActive(poll) ? "default" : "outline"}
                size="lg"
                className="min-w-32"
              >
                {isPollActive(poll) ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="m8 12 3 3 6-6" />
                    </svg>
                    Vote Now
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M3 3v18h18" />
                      <path d="m9 9 3 3 2-2 3 3" />
                      <path d="M14 8h5v5" />
                    </svg>
                    View Results
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
} 
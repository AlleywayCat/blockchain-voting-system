"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { VotingClient, PollData } from "./client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface PollDetailsProps {
  pollAddress: string;
}

export function PollDetails({ pollAddress }: PollDetailsProps) {
  console.log("PollDetails component loaded with pollAddress:", pollAddress);

  const { connection } = useConnection();
  const wallet = useWallet();
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true); // Default to true for public polls
  const [registering, setRegistering] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Confirmation dialog for delete action
  const { openDialog: openDeleteDialog, ConfirmationDialog: DeleteConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    const fetchPollData = async () => {
      try {
        setLoading(true);
        
        console.log("Fetching poll data from API...");
        const response = await fetch(`/api/polls/${pollAddress}`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Unknown error from API");
        }
        
        // Transform the API response to match our model
        console.log("Raw poll data from API:", data.poll);
        if (data.poll) {
          const pollData: PollData = {
            address: new PublicKey(pollAddress),
            name: data.poll.name,
            description: data.poll.description,
            options: data.poll.options.map((opt: any, index: number) => ({
              text: typeof opt === 'string' ? opt : opt.text,
              voteCount: typeof opt === 'string' ? 0 : (opt.voteCount || 0)
            })),
            startTime: data.poll.startTime,
            endTime: data.poll.endTime,
            isPublic: data.poll.isPublic,
            isActive: data.poll.isActive,
            creator: new PublicKey(data.poll.creator),
            totalVotes: data.poll.options.reduce((sum: number, opt: any) => sum + (opt.voteCount || 0), 0)
          };
          
          setPoll(pollData);
          
          // For client-side-only operations that need the wallet
          if (wallet.connected && wallet.publicKey) {
            try {
              // Check if user has voted using API route
              const voterPublicKey = wallet.publicKey.toString();
              
              const hasVotedResponse = await fetch(
                `/api/polls/${pollAddress}/hasVoted?voter=${voterPublicKey}`
              );
              
              if (hasVotedResponse.ok) {
                const hasVotedData = await hasVotedResponse.json();
                if (hasVotedData.success) {
                  setHasVoted(hasVotedData.hasVoted);
                }
              }
              
              // For private polls, check if user is registered
              if (!pollData.isPublic) {
                const isRegisteredResponse = await fetch(
                  `/api/polls/${pollAddress}/isRegistered?voter=${voterPublicKey}`
                );
                
                if (isRegisteredResponse.ok) {
                  const isRegisteredData = await isRegisteredResponse.json();
                  if (isRegisteredData.success) {
                    setIsRegistered(isRegisteredData.isRegistered);
                  }
                }
              }
            } catch (apiError) {
              console.warn("Non-critical API operations failed:", apiError);
              // Don't fail the whole component if these checks fail
              // Just assume defaults
              setHasVoted(false);
              setIsRegistered(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching poll data:", error);
        toast.error("Failed to load poll data");
      } finally {
        setLoading(false);
      }
    };

    fetchPollData();
  }, [connection, wallet, pollAddress, wallet.connected, wallet.publicKey]);

  const handleVote = async () => {
    if (!wallet.connected || !poll || selectedOption === null) {
      return;
    }

    try {
      setIsVoting(true);
      
      // Get the selected option text
      const optionText = poll.options[selectedOption].text;
      
      // Call the vote API to get transaction
      const response = await fetch(`/api/polls/${pollAddress}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          optionIndex: selectedOption,
          voter: wallet.publicKey?.toString(),
          isPublic: poll.isPublic
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.transaction) {
        // Deserialize and sign the transaction
        const { Connection, PublicKey, Transaction } = await import('@solana/web3.js');
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=28bfff14-4e1a-447d-ba02-2b8bf09c1dc1',
          'confirmed'
        );
        
        const transaction = Transaction.from(new Uint8Array(data.transaction));
        
        if (!wallet.signTransaction) {
          throw new Error('Wallet does not support transaction signing');
        }
        
        // Check wallet connection again before signing
        if (!wallet.connected || !wallet.signTransaction) {
          throw new Error('Wallet disconnected during transaction preparation');
        }

        // Get fresh blockhash before signing to avoid expiration
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;

        // Final wallet check before signing
        if (!wallet.connected || !wallet.publicKey) {
          throw new Error('Wallet disconnected. Please reconnect and try again.');
        }

        // Sign the transaction
        const signedTx = await wallet.signTransaction(transaction);
        
        // Send the transaction
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        console.log('Vote transaction signature:', signature);
        
        // Wait for confirmation using the new API
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
        
        toast.success("Vote cast successfully!");
      } else {
        toast.success("Vote cast successfully!");
      }
      setHasVoted(true);
      
      // Refresh poll data
      const pollResponse = await fetch(`/api/polls/${pollAddress}`);
      if (pollResponse.ok) {
        const data = await pollResponse.json();
        if (data.success && data.poll) {
          const updatedPoll: PollData = {
            address: new PublicKey(pollAddress),
            name: data.poll.name,
            description: data.poll.description,
            options: data.poll.options.map((opt: any, index: number) => ({
              text: typeof opt === 'string' ? opt : opt.text,
              voteCount: typeof opt === 'string' ? 0 : (opt.voteCount || 0)
            })),
            startTime: data.poll.startTime,
            endTime: data.poll.endTime,
            isPublic: data.poll.isPublic,
            isActive: data.poll.isActive,
            creator: new PublicKey(data.poll.creator),
            totalVotes: data.poll.options.reduce((sum: number, opt: any) => sum + (opt.voteCount || 0), 0)
          };
          setPoll(updatedPoll);
        }
      }
    } catch (error: any) {
      console.error("Error casting vote:", error);

      // Handle specific wallet disconnection errors
      if (error.name === 'WalletDisconnectedError' || error.message?.includes('disconnected')) {
        toast.error("Wallet disconnected. Please reconnect your wallet and try again.");
      } else if (error.message?.includes('User rejected')) {
        toast.error("Transaction was rejected by the user.");
      } else if (error.message?.includes('insufficient funds')) {
        toast.error("Insufficient SOL balance to pay for transaction fees.");
      } else {
        toast.error(error.message || "Failed to cast vote");
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleRegister = async () => {
    if (!wallet.connected || !poll || !wallet.publicKey) {
      return;
    }

    try {
      setRegistering(true);
      
      // Call the register API (to be implemented)
      const response = await fetch(`/api/polls/${pollAddress}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voter: wallet.publicKey.toString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed with status: ${response.status}`);
      }
      
      toast.success("Registered as a voter successfully!");
      setIsRegistered(true);
    } catch (error) {
      console.error("Error registering as voter:", error);
      toast.error("Failed to register as voter");
    } finally {
      setRegistering(false);
    }
  };

  const handleClosePoll = async () => {
    if (!wallet.connected || !poll || !wallet.publicKey) {
      return;
    }

    try {
      setIsClosing(true);
      
      // Call the close API
      const response = await fetch(`/api/polls/${pollAddress}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authority: wallet.publicKey.toString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed with status: ${response.status}`);
      }

      const { transaction: txArray, blockhash, lastValidBlockHeight } = await response.json();
      
      // Convert array back to Uint8Array and deserialize
      const txBuffer = new Uint8Array(txArray);
      const transaction = Transaction.from(txBuffer);
      
      // Update transaction with fresh blockhash
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      
      // Sign the transaction
      // Check wallet connection before signing
      if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
        throw new Error('Wallet disconnected. Please reconnect and try again.');
      }

      const signedTx = await wallet.signTransaction(transaction);
      
      // Send the transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      console.log('Close transaction signature:', signature);
      
      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      toast.success("Poll closed successfully!");
      
      // Refresh poll data
      window.location.reload();
      
    } catch (error: any) {
      console.error("Error closing poll:", error);

      // Handle specific wallet disconnection errors
      if (error.name === 'WalletDisconnectedError' || error.message?.includes('disconnected')) {
        toast.error("Wallet disconnected. Please reconnect your wallet and try again.");
      } else if (error.message?.includes('User rejected')) {
        toast.error("Transaction was rejected by the user.");
      } else {
        toast.error(error.message || "Failed to close poll");
      }
    } finally {
      setIsClosing(false);
    }
  };

  const confirmDeletePoll = () => {
    openDeleteDialog(
      {
        title: "Delete Poll",
        description: "Are you sure you want to delete this poll? This action cannot be undone and will recover the account rent to your wallet.",
        confirmText: "Delete Poll",
        cancelText: "Cancel",
        variant: "destructive",
        icon: "delete",
        isLoading: isDeleting,
      },
      handleDeletePoll
    );
  };

  const handleDeletePoll = async () => {
    if (!wallet.connected || !poll || !wallet.publicKey) {
      return;
    }

    try {
      setIsDeleting(true);
      
      // Call the delete API
      const response = await fetch(`/api/polls/${pollAddress}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authority: wallet.publicKey.toString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed with status: ${response.status}`);
      }

      const { transaction: txArray, blockhash, lastValidBlockHeight } = await response.json();
      
      // Convert array back to Uint8Array and deserialize
      const txBuffer = new Uint8Array(txArray);
      const transaction = Transaction.from(txBuffer);
      
      // Update transaction with fresh blockhash
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      
      // Sign the transaction
      // Check wallet connection before signing
      if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
        throw new Error('Wallet disconnected. Please reconnect and try again.');
      }

      const signedTx = await wallet.signTransaction(transaction);
      
      // Send the transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      console.log('Delete transaction signature:', signature);
      
      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      toast.success("Poll deleted successfully! Rent has been recovered.");
      
      // Redirect to polls page
      window.location.href = '/polls';
      
    } catch (error: any) {
      console.error("Error deleting poll:", error);

      // Handle specific wallet disconnection errors
      if (error.name === 'WalletDisconnectedError' || error.message?.includes('disconnected')) {
        toast.error("Wallet disconnected. Please reconnect your wallet and try again.");
      } else if (error.message?.includes('User rejected')) {
        toast.error("Transaction was rejected by the user.");
      } else {
        toast.error(error.message || "Failed to delete poll");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getPollStatus = () => {
    if (!poll) return { label: "", color: "" };

    const now = Math.floor(Date.now() / 1000);

    if (now < poll.startTime) {
      return {
        label: "Upcoming",
        color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/30"
      };
    } else if (!poll.isActive) {
      return {
        label: "Closed",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/30"
      };
    } else if (now >= poll.startTime && now <= poll.endTime) {
      return {
        label: "Active",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30"
      };
    } else {
      return {
        label: "Ended",
        color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
      };
    }
  };

  const isPollActive = () => {
    if (!poll) return false;
    const now = Math.floor(Date.now() / 1000);
    return poll.isActive && now >= poll.startTime && now <= poll.endTime;
  };

  const isCurrentUserCreator = () => {
    if (!poll || !wallet.connected || !wallet.publicKey) return false;
    return poll.creator.toString() === wallet.publicKey.toString();
  };

  const calculatePercentage = (votes: number) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  if (loading) {
    return (
      <Card className="w-full bg-white/90 dark:bg-slate-800/60 border-blue-100 dark:border-blue-900/30 shadow-md overflow-hidden">
        <CardHeader>
          <Skeleton className="h-8 w-2/3 mb-3" />
          <Skeleton className="h-4 w-1/3 mb-6" />
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (!poll) {
    return (
      <Card className="w-full bg-white/90 dark:bg-slate-800/60 border-blue-100 dark:border-blue-900/30 shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-200">Poll Not Found</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            The poll you are looking for could not be found. It may have been deleted or you may have entered an incorrect address.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={() => window.location.href = "/votingsystem"}
            variant="default"
          >
            Back to Polls
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const status = getPollStatus();

  return (
    <Card className="w-full bg-white/90 dark:bg-slate-800/60 border-blue-100 dark:border-blue-900/30 shadow-md overflow-hidden">
      <CardHeader className="pb-2 border-b border-blue-100 dark:border-blue-900/30">
        <div className="flex flex-wrap items-start justify-between mb-2">
          <div>
            <CardTitle className="text-2xl text-slate-800 dark:text-slate-200 mb-1">{poll.name}</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              {poll.isPublic ? "Public Poll" : "Private Poll"} • {poll.totalVotes} votes
            </CardDescription>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div>
          <p className="text-slate-700 dark:text-slate-300 mb-4">{poll.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Start: {formatDate(poll.startTime)}</span>
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>End: {formatDate(poll.endTime)}</span>
            </div>
          </div>
        </div>
        
        {!poll.isPublic && !isRegistered && (
          <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" x2="12" y1="9" y2="13" />
              <line x1="12" x2="12.01" y1="17" y2="17" />
            </svg>
            <AlertTitle>Registration Required</AlertTitle>
            <AlertDescription>
              This is a private poll. You need to register before you can vote.
            </AlertDescription>
          </Alert>
        )}
        
        <div>
          <h3 className="text-lg font-medium mb-3 text-slate-800 dark:text-slate-200">
            {hasVoted ? "Results" : "Options"}
          </h3>
          
          {hasVoted || !isPollActive() ? (
            // Show results if user has voted or poll is not active
            <div className="space-y-4">
              {poll.options.map((option, index) => {
                const percentage = calculatePercentage(option.voteCount);
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{option.text}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {option.voteCount} votes ({percentage}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2 bg-slate-100 dark:bg-slate-700" />
                  </div>
                );
              })}
            </div>
          ) : (
            // Show voting options if user hasn't voted and poll is active
            <RadioGroup
              value={selectedOption?.toString()}
              onValueChange={(value: string) => setSelectedOption(parseInt(value))}
              className="space-y-3"
            >
              {poll.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border border-blue-100 dark:border-blue-900/30 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} className="text-blue-600 dark:text-blue-400 border-slate-300 dark:border-slate-600" />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-slate-700 dark:text-slate-300">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      </CardContent>
      
      {isPollActive() && !hasVoted && (
        <CardFooter className="border-t border-blue-100 dark:border-blue-900/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4">
          {!poll.isPublic && !isRegistered ? (
            <Button
              onClick={handleRegister}
              disabled={registering || !wallet.connected}
              variant="default"
              size="lg"
              className="w-full"
            >
              {registering ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Register to Vote
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleVote}
              disabled={selectedOption === null || isVoting || !wallet.connected || !isRegistered}
              variant="default"
              size="lg"
              className="w-full"
            >
              {isVoting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Casting Vote...
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m8 12 3 3 6-6" />
                  </svg>
                  Cast Your Vote
                </>
              )}
            </Button>
          )}
        </CardFooter>
      )}
      
      {!isPollActive() && !hasVoted && (
        <CardFooter className="border-t border-blue-100 dark:border-blue-900/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4">
          <div className="w-full text-center text-slate-600 dark:text-slate-400">
            {Math.floor(Date.now() / 1000) < poll.startTime
              ? "This poll has not started yet. Check back later to cast your vote."
              : !poll.isActive
                ? "This poll has been closed by the creator. You can view the results above."
                : "This poll has ended. You can view the results above."}
          </div>
        </CardFooter>
      )}

      {/* Poll Management Actions for Creators */}
      {isCurrentUserCreator() && (
        <CardFooter className="border-t border-orange-100 dark:border-orange-900/30 bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-900/10 dark:to-red-900/10 p-4">
          <div className="w-full space-y-3">
            <div className="text-sm font-medium text-orange-800 dark:text-orange-200 text-center mb-3">
              Poll Management (Creator Only)
            </div>
            <div className="flex gap-3">
              {poll.isActive && (
                <Button
                  onClick={handleClosePoll}
                  disabled={isClosing}
                  variant="outline"
                  className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
                >
                  {isClosing ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Closing...
                    </div>
                  ) : (
                    "Close Poll"
                  )}
                </Button>
              )}
              <Button
                onClick={confirmDeletePoll}
                disabled={isDeleting}
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </div>
                ) : (
                  "Delete Poll"
                )}
              </Button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
              {poll.isActive ? "Close to disable voting, or delete to recover rent." : "Delete to recover the account rent."}
            </div>
          </div>
        </CardFooter>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog />
    </Card>
  );
} 
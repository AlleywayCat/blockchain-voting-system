"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { VotingClient } from "./client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import { X, Plus, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { SOLANA_RPC_URL, COMMITMENT_LEVEL } from '@/lib/solana-config';

export function CreatePoll() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isPublic, setIsPublic] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    } else {
      toast.error("Maximum 10 options allowed");
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    } else {
      toast.error("Minimum 2 options required");
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!wallet.publicKey) {
      toast.error("Wallet is connected but public key is not available");
      return;
    }
    
    // Check if wallet adapter is ready
    if (wallet.connecting || wallet.disconnecting) {
      toast.error("Wallet is currently connecting or disconnecting. Please wait.");
      return;
    }
    
    if (name.trim() === "") {
      toast.error("Please enter a poll name");
      return;
    }
    
    if (description.trim() === "") {
      toast.error("Please enter a poll description");
      return;
    }
    
    const validOptions = options.filter(option => option.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 valid options");
      return;
    }
    
    if (!startTime || !endTime) {
      toast.error("Please select both start and end dates");
      return;
    }
    
    console.log("Raw date values:", { startTime, endTime });
    
    // Make sure we're working with valid dates
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    console.log("Parsed Date objects:", { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(), 
      valid: !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) 
    });
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error("Please select valid start and end dates");
      return;
    }
    
    // Convert to Unix timestamp (seconds)
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    
    console.log("Timestamp values (seconds):", { startTimestamp, endTimestamp });
    
    if (endTimestamp <= startTimestamp) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setIsLoading(true);
      
      console.log("Creating poll with details:", {
        name,
        description,
        options: validOptions,
        startDate: new Date(startTimestamp * 1000).toISOString(),
        endDate: new Date(endTimestamp * 1000).toISOString(),
        isPublic
      });
      
      console.log("Wallet details:", {
        connected: wallet.connected,
        publicKey: wallet.publicKey?.toString(),
        readyState: wallet.connected ? "connected" : "disconnected"
      });
      
      console.log("Connection details:", {
        connectionAvailable: !!connection,
        endpoint: connection?.rpcEndpoint
      });
      
      // Create the client
      let client;
      try {
        client = new VotingClient(connection, wallet);
      } catch (clientError) {
        console.error("Failed to initialize client:", clientError);
        toast.error("Failed to initialize voting client. Please try reconnecting your wallet.");
        setIsLoading(false);
        return;
      }
      
      console.log("Client initialized:", {
        isConnected: client.isConnected,
        providerAvailable: client.providerAvailable,
        isBrowserEnvironment: client.isBrowserEnvironment
      });
      
      // ALWAYS use the API method for more reliable poll creation
      // The direct client method is problematic in browser environments
      console.warn("Using API method for more reliable poll creation");
      toast.info("Creating poll via server...");
      
      try {
        const pollAddress = await createPollViaAPI(
          name,
          description,
          validOptions,
          startTimestamp,
          endTimestamp,
          isPublic
        );
        
        console.log("Poll created successfully via API:", pollAddress.toString());
        toast.success("Poll created successfully!");

        // Invalidate the polls cache to show the new poll immediately
        queryClient.invalidateQueries({ queryKey: ['polls'] });

        const navigationUrl = `/polls/${pollAddress.toString()}`;
        console.log("Navigating to:", navigationUrl);

        // Reset form
        setName("");
        setDescription("");
        setOptions(["", ""]);
        setIsPublic(true);
        setStartTime("");
        setEndTime("");

        // Navigate to the poll detail page
        router.push(navigationUrl);
        console.log("Navigation command executed");
        
        return;
      } catch (apiError: any) {
        console.error("Error creating poll via API:", apiError);
        toast.error(`Failed to create poll: ${apiError.message || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        toast.error(`Failed to create poll: ${error.message}`);
      } else {
        console.error("Unknown error type:", typeof error);
        console.error("Error string representation:", String(error));
        toast.error("Failed to create poll. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to create poll using the API route
  const createPollViaAPI = async (
    name: string,
    description: string,
    options: string[],
    startTimestamp: number,
    endTimestamp: number,
    isPublic: boolean
  ) => {
    try {
      console.log("Starting poll creation via API...");
      
      // Make sure wallet is connected
      if (!wallet.publicKey) {
        console.error("Wallet not connected");
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }
      
      console.log("Using wallet:", wallet.publicKey.toString());
      
      // Create the request body
      const requestBody = {
        name,
        description,
        options,
        startTime: startTimestamp,
        endTime: endTimestamp,
        isPublic,
        creator: wallet.publicKey.toString()
      };
      
      console.log("Sending API request to create poll...");
      
      // Call the API route to create the poll and get back a transaction
      const response = await fetch('/api/polls/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      // Log the response status
      console.log("API response status:", response.status, response.statusText);
      
      // Parse the response JSON
      const data = await response.json();
      console.log("API response data:", data);
      
      if (!response.ok) {
        // Extract the specific error message from the response if available
        const errorMessage = data?.error || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // Check if the response contains the transaction
      if (!data.transaction) {
        throw new Error("No transaction returned from server");
      }

      // Check if the response contains the poll address
      if (!data.pollAddress) {
        throw new Error("No poll address returned from server");
      }
      
      console.log("Got transaction from server, preparing to sign...");
      
      try {
        // Deserialize the transaction
        const transactionBuffer = Buffer.from(data.transaction, 'base64');
        const transaction = Transaction.from(transactionBuffer);
        
        console.log("Transaction deserialized, details:", {
          numInstructions: transaction.instructions.length,
          feePayer: transaction.feePayer?.toString(),
          recentBlockhash: transaction.recentBlockhash
        });
        
        // Show a notification to the user that they need to sign the transaction
        toast.info("Please approve the transaction in your wallet", {
          duration: 10000,
        });
        
        // Sign the transaction with the wallet
        console.log("Requesting wallet signature...");
        if (!wallet.signTransaction) {
          throw new Error("Wallet does not support transaction signing");
        }
        
        // Ensure the fee payer is set to the wallet's public key
        transaction.feePayer = wallet.publicKey;

        // Add some delay to ensure wallet UI has time to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Final wallet connection check before signing
        if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
          throw new Error('Wallet disconnected. Please reconnect and try again.');
        }

        const signedTransaction = await wallet.signTransaction(transaction);
        console.log("Transaction signed by wallet");
        
        // Send the signed transaction to the network
        console.log("Sending transaction to Solana network...");
        const connection = new Connection(
          SOLANA_RPC_URL,
          COMMITMENT_LEVEL
        );
        
        // Show sending toast
        toast.info("Submitting transaction to blockchain...");
        
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize()
        );
        
        console.log("Transaction sent, signature:", signature);
        
        // Wait for confirmation
        toast.info("Waiting for blockchain confirmation...");
        console.log("Waiting for transaction confirmation...");
        const confirmation = await connection.confirmTransaction(signature, COMMITMENT_LEVEL);
        console.log("Transaction confirmed:", confirmation);
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
        }
        
        toast.success("Transaction confirmed successfully!");
        
        // Return the poll address
        return new PublicKey(data.pollAddress);
      } catch (txError) {
        console.error("Transaction error:", txError);
        
        // Provide more helpful error messages
        if (txError instanceof Error) {
          if (txError.name === 'WalletDisconnectedError' || txError.message.includes("disconnected")) {
            throw new Error("Wallet disconnected. Please reconnect your wallet and try again.");
          }
          if (txError.message.includes("User rejected")) {
            throw new Error("Transaction was rejected by the wallet");
          }
          if (txError.message.includes("insufficient funds")) {
            throw new Error("Insufficient SOL balance to pay for transaction fees.");
          }
          if (txError.message.includes("network")) {
            throw new Error("Network error while sending transaction. Please check your internet connection.");
          }
          if (txError.message.includes("blockhash")) {
            throw new Error("Transaction failed due to expired blockhash. Please try again.");
          }

          throw new Error(`Transaction error: ${txError.message}`);
        }
        
        throw new Error("Failed to send transaction to Solana network");
      }
    } catch (error) {
      console.error("Poll creation error:", error);
      throw error;
    }
  };

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHeader className="p-7 border-b border-[#e8e8ed] dark:border-[#3a3a3c]">
          <CardTitle className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">Create a New Poll</CardTitle>
          <CardDescription className="text-[#6e6e73] dark:text-[#86868b] mt-2">
            Fill out the form below to create a new poll. All fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Poll Name
              </Label>
              <Input
                id="name"
                placeholder="Enter poll name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                maxLength={50}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what this poll is about"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#1d1d1f] dark:text-white">
                Options (2-10)
              </label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOption(index, e.target.value)}
                      maxLength={50}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= 2}
                      className="h-10 w-10 p-0 rounded-full flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={options.length >= 10}
                  className="mt-4 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Option
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium">
                  Start Time
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium">
                  End Time
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-[#e8e8ed] dark:border-[#3a3a3c]">
              <div className="flex-shrink-0">
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  className="data-[state=checked]:bg-[#0071e3]"
                />
              </div>
              <div className="flex flex-col">
                <Label 
                  htmlFor="isPublic" 
                  className="text-base font-medium text-[#1d1d1f] dark:text-white"
                >
                  Public Poll
                </Label>
                <p className="text-sm text-[#6e6e73] dark:text-[#86868b] mt-1">
                  Anyone can view and vote in this poll. Turn off for a private poll where only specific voters can participate.
                </p>
              </div>
            </div>
          
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="default"
                size="lg"
                disabled={isLoading || !wallet.connected}
                className="min-w-32"
              >
                {isLoading ? "Creating Poll..." : "Create Poll"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
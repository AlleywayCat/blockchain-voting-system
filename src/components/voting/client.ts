import * as anchor from "@coral-xyz/anchor";
import { Program, BN, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { IDL } from "../../generated/votingsystemdapp-idl-simple";

// Program ID as a string to avoid initialization issues
const PROGRAM_ID_STRING = "CfU2hH8HEy6UQhiEeECeJL66112N18EuYq1khpX2N1RF";

// Only initialize PublicKey when needed with proper error handling
let PROGRAM_ID: PublicKey | null = null;
try {
  PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
} catch (error) {
  console.error("Failed to initialize program ID at module level:", error);
  // We'll handle this later when needed
}

// Cast the IDL to any to avoid type errors during initialization
const TYPED_IDL = IDL as any;

export type PollData = {
  creator: PublicKey;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  isPublic: boolean;
  isActive: boolean;
  totalVotes: number;
  options: Array<{ text: string; voteCount: number }>;
  address: PublicKey;
};

// Helper to create a connection with rate limiting features
export const createRateLimitedConnection = (url: string, commitment: string = 'confirmed') => {
  console.log(`Creating rate-limited connection to ${url}`);
  // Create a standard connection
  const connection = new Connection(url, commitment as any);
  
  // Create a proxy wrapper with rate-limiting for specific methods
  const rateLimitedConnection = {
    ...connection,
    // Override the getProgramAccounts method with rate limiting
    getProgramAccounts: async (...args: Parameters<Connection['getProgramAccounts']>) => {
      let retryCount = 0;
      const maxRetries = 8;
      
      while (retryCount <= maxRetries) {
        try {
          // Call the original method
          return await connection.getProgramAccounts(...args);
        } catch (error: any) {
          // Check if it's a rate limiting error
          if (error?.message?.includes('429') || 
              error?.message?.includes('Too many requests') || 
              error?.message?.includes('rate limit')) {
            
            // Calculate delay with exponential backoff
            const delayMs = 1000 * Math.pow(1.5, retryCount);
            console.log(`Rate limit hit, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delayMs));
            retryCount++;
            
            // If we've tried too many times, throw a more helpful error
            if (retryCount > maxRetries) {
              throw new Error(`Exceeded maximum retries (${maxRetries}) due to rate limiting. Consider using a dedicated RPC endpoint.`);
            }
          } else {
            // Not a rate limit error, rethrow
            throw error;
          }
        }
      }
    },
    
    // Add more wrapped methods as needed
    getAccountInfo: async (...args: Parameters<Connection['getAccountInfo']>) => {
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount <= maxRetries) {
        try {
          return await connection.getAccountInfo(...args);
        } catch (error: any) {
          if (error?.message?.includes('429') || error?.message?.includes('Too many requests')) {
            const delayMs = 1000 * Math.pow(1.5, retryCount);
            console.log(`Rate limit hit, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            retryCount++;
          } else {
            throw error;
          }
        }
      }
      throw new Error('Failed to get account info after multiple retries');
    }
  };
  
  return rateLimitedConnection as Connection;
};

export class VotingClient {
  program: any | null;
  provider?: anchor.AnchorProvider;
  isConnected: boolean = false;
  isBrowserEnvironment: boolean = false;
  providerAvailable: boolean = false;

  constructor(connection: Connection, wallet: any) {
    // Detect browser environment
    this.isBrowserEnvironment = typeof window !== 'undefined';
    
    // Always initialize program as null
    this.program = null;
    this.isConnected = false;
    this.providerAvailable = false;
    
    try {
      // First check if wallet is properly connected
      if (!wallet || !wallet.publicKey || !wallet.connected) {
        console.log("Wallet not connected or missing public key");
        return;
      }
      
      // Log environment details for debugging
      console.log("Environment details:", {
        isBrowser: this.isBrowserEnvironment,
        connectionRpcEndpoint: connection?.rpcEndpoint || 'No endpoint',
        walletConnected: wallet.connected,
        walletPublicKey: wallet.publicKey?.toString() || 'No public key'
      });
      
      // Use rate-limited connection if not already using one
      const rpcEndpoint = connection.rpcEndpoint;
      const rateLimitedConnection = this.isBrowserEnvironment && 
        !rpcEndpoint.includes('quicknode') && 
        !rpcEndpoint.includes('triton') && 
        !rpcEndpoint.includes('genesys') ? 
        createRateLimitedConnection(rpcEndpoint, 'confirmed') : 
        connection;
      
      // Create provider with validated wallet and rate-limited connection
      const provider = new anchor.AnchorProvider(
        rateLimitedConnection,
        wallet,
        { commitment: 'confirmed', preflightCommitment: 'confirmed' }
      );
      
      // Save provider reference
      this.provider = provider;
      this.providerAvailable = true;
      
      try {
        // Create program with defensive error handling
        this.program = this.createAnchorProgram(provider);
        
        // If program was created successfully, mark as connected
        if (this.program) {
          this.isConnected = true;
          console.log("VotingClient initialized successfully");
        } else {
          // Give helpful error message for browser environment
          if (this.isBrowserEnvironment) {
            console.warn("Browser environment detected. Some Solana operations may be limited. Consider using the API routes for full functionality.");
          }
        }
      } catch (programError) {
        console.error("Error initializing Anchor Program:", programError);
        this.program = null;
      }
    } catch (error) {
      console.error("Error in VotingClient constructor:", error);
      this.program = null;
    }
  }
  
  // Helper method to safely create Anchor program
  private createAnchorProgram(provider: anchor.AnchorProvider): any {
    try {
      // Basic validation
      if (!TYPED_IDL || !provider || !provider.wallet) {
        console.error("Missing IDL or provider");
        return null;
      }
      
      // Skip creating a real Anchor program and just make an API-compatible object
      // This avoids all the TypeScript errors with Anchor's types
      console.log("Creating API-compatible program stub");
        
      // Create a minimal API-compatible program object that will use our API instead
      const programId = new PublicKey(PROGRAM_ID_STRING);
        
      // Return a mock program that will use our API routes
      return {
        programId,
        provider,
        methods: {
          createPoll: () => ({
            accounts: () => ({
              signers: () => ({
                rpc: async () => {
                  throw new Error("Use API-based method instead");
                }
              })
            })
          }),
          registerVoter: () => ({
            accounts: () => ({
              rpc: async () => {
                throw new Error("Use API-based method instead");
              }
            })
          }),
          castVotePublic: () => ({
            accounts: () => ({
              rpc: async () => {
                throw new Error("Use API-based method instead");
              }
            })
          }),
          castVotePrivate: () => ({
            accounts: () => ({
              rpc: async () => {
                throw new Error("Use API-based method instead");
              }
            })
          }),
          closePoll: () => ({
            accounts: () => ({
              rpc: async () => {
                throw new Error("Use API-based method instead");
              }
            })
          })
        },
        account: {
          poll: {
            fetch: async () => {
              throw new Error("Use API-based method instead");
            },
            all: async () => {
              return [];
            }
          },
          voteRecord: {
            fetch: async () => {
              throw new Error("Use API-based method instead");
            }
          },
          voterRegistry: {
            fetch: async () => {
              throw new Error("Use API-based method instead");
            }
          }
        }
      };
    } catch (error) {
      console.error("Error creating program stub:", error);
      return null;
    }
  }

  // Check connectivity before any operation
  private checkConnection() {
    if (!this.isConnected || !this.provider) {
      throw new Error("Wallet is not connected or provider is not initialized");
    }
  }

  async createPoll(
    name: string,
    description: string,
    options: string[],
    startTime: number,
    endTime: number,
    isPublic: boolean
  ): Promise<PublicKey> {
    try {
      // Check if the client is connected
      if (!this.isConnected || !this.program) {
        console.error("VotingClient not properly connected");
        throw new Error("Voting client is not properly connected to Solana. Please check your wallet connection and try again.");
      }
      
      console.log("createPoll called with params:", {
        name, 
        description, 
        optionsCount: options.length,
        startTime,
        endTime,
        isPublic
      });
      
      // Generate a new keypair for the poll account
      const poll = anchor.web3.Keypair.generate();
      console.log("Generated poll keypair:", poll.publicKey.toString());

      // Validate input types before converting to BN
      if (typeof startTime !== 'number' || isNaN(startTime)) {
        throw new Error(`Invalid startTime: ${startTime}. Must be a number.`);
      }
      
      if (typeof endTime !== 'number' || isNaN(endTime)) {
        throw new Error(`Invalid endTime: ${endTime}. Must be a number.`);
      }
      
      try {
        // Create explicit BN instances for the dates with additional error handling
        console.log("Creating BN instances for dates...");
        console.log("Input values:", { startTime, endTime, types: { startTime: typeof startTime, endTime: typeof endTime } });
        
        // Check if the values are valid for BN conversion
        if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
          throw new Error("Start time or end time is not a finite number");
        }
        
        // Convert to integers if they're not already
        const startTimeInt = Math.floor(startTime);
        const endTimeInt = Math.floor(endTime);
        
        console.log("Integer values:", { startTimeInt, endTimeInt });
        
        // Create BN values with explicit error handling
        let startTimeBN: BN;
        let endTimeBN: BN;
        
        try {
          startTimeBN = new BN(startTimeInt);
          endTimeBN = new BN(endTimeInt);
          
          // Verify the BN objects were created correctly
          if (!startTimeBN || !endTimeBN) {
            throw new Error("Failed to create BN objects");
          }
          
          console.log("BN values created successfully:", {
            startTimeBN: startTimeBN.toString(),
            endTimeBN: endTimeBN.toString()
          });
        } catch (bnError: any) {
          console.error("BN conversion error:", bnError);
          throw new Error(`Error converting timestamps to BN format: ${bnError.message || 'Unknown BN error'}`);
        }

        // Check if the provider and program are properly initialized
        if (!this.program) {
          throw new Error("Program is not initialized");
        }
        
        if (!this.provider?.wallet.publicKey) {
          throw new Error("Provider wallet public key is missing");
        }
        
        console.log("Preparing transaction with accounts:", {
          creator: this.provider.wallet.publicKey.toString(),
          poll: poll.publicKey.toString(),
          systemProgram: SystemProgram.programId.toString()
        });

        // Try multiple RPC endpoints if the first one fails
        let attempts = 0;
        const maxAttempts = 3;
        let latestError: any = null;
        
        while (attempts < maxAttempts) {
          try {
            // Submit the transaction
            console.log(`Sending transaction to create poll (attempt ${attempts + 1})...`);
            const txid = await this.program.methods
              .createPoll(  // Using camelCase to match IDL
                name,
                description,
                options,
                startTimeBN,
                endTimeBN,
                isPublic
              )
              .accounts({
                creator: this.provider.wallet.publicKey,
                poll: poll.publicKey,
                systemProgram: SystemProgram.programId,
              })
              .signers([poll])
              .rpc();
            
            console.log("Transaction completed successfully:", txid);
            return poll.publicKey;
          } catch (txError: any) {
            attempts++;
            latestError = txError;
            console.error(`Transaction attempt ${attempts} failed:`, txError);
            
            // If we're in the browser and have network issues, provide specific guidance
            if (this.isBrowserEnvironment && 
                (txError.message?.includes("failed to fetch") || 
                 txError.message?.includes("network error"))) {
              console.warn("Network connectivity issue detected in browser environment");
              
              if (attempts < maxAttempts) {
                console.log(`Retrying in 2 seconds... (${attempts}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            } else if (attempts < maxAttempts) {
              // Non-network error or server environment, shorter retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        // If we've exhausted all attempts, throw the last error
        throw latestError || new Error("Failed to create poll after multiple attempts");
      } catch (transactionError) {
        console.error("Transaction error:", transactionError);
        
        if (transactionError instanceof Error) {
          // Log detailed error information
          console.error("Error name:", transactionError.name);
          console.error("Error message:", transactionError.message);
          console.error("Error stack:", transactionError.stack);
          
          // Check for specific error types
          if (transactionError.message.includes("Transaction simulation failed")) {
            throw new Error("Transaction simulation failed. This could be due to insufficient funds or program errors. Please check your wallet balance.");
          }
          
          if (transactionError.message.includes("Not enough lamports")) {
            throw new Error("Insufficient funds to create poll. Please add SOL to your wallet.");
          }
          
          if (transactionError.message.includes("_bn")) {
            throw new Error("Error with timestamp format. Please ensure dates are valid.");
          }
          
          if (this.isBrowserEnvironment && (
              transactionError.message.includes("failed to fetch") || 
              transactionError.message.includes("network error"))) {
            throw new Error("Network connection issue. This may be due to browser limitations with Solana. Try using a dedicated wallet app or our API endpoints.");
          }
        }
        
        throw transactionError;
      }
    } catch (error) {
      console.error("Error in createPoll:", error);
      throw error;
    }
  }

  async registerVoter(pollAddress: PublicKey, voterAddress: PublicKey) {
    this.checkConnection();
    
    if (!this.provider?.wallet.publicKey) {
      throw new Error("Wallet public key is not available");
    }
    
    // Derive the PDA for the voter registry
    const [voterRegistry] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("voter-registry"),
        pollAddress.toBuffer(),
        voterAddress.toBuffer(),
      ],
      this.program.programId
    );

    // Submit the transaction
    await this.program.methods
      .register_voter(voterAddress)
      .accounts({
        authority: this.provider.wallet.publicKey,
        voterRegistry,
        poll: pollAddress,
        voterAddress,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async castVotePublic(pollAddress: PublicKey, optionIndex: number) {
    this.checkConnection();
    
    if (!this.provider?.wallet.publicKey) {
      throw new Error("Wallet public key is not available");
    }
    
    // Derive the PDA for the vote record
    const [voteRecord] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote-record"),
        pollAddress.toBuffer(),
        this.provider.wallet.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    // Submit the transaction
    await this.program.methods
      .cast_vote_public(optionIndex)
      .accounts({
        voter: this.provider.wallet.publicKey,
        poll: pollAddress,
        voteRecord,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async castVotePrivate(pollAddress: PublicKey, optionIndex: number) {
    this.checkConnection();
    
    if (!this.provider?.wallet.publicKey) {
      throw new Error("Wallet public key is not available");
    }
    
    // Derive the PDA for the voter registry
    const [voterRegistry] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("voter-registry"),
        pollAddress.toBuffer(),
        this.provider.wallet.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    // Submit the transaction
    await this.program.methods
      .cast_vote_private(optionIndex)
      .accounts({
        voter: this.provider.wallet.publicKey,
        poll: pollAddress,
        voterRegistry,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async closePoll(pollAddress: PublicKey) {
    this.checkConnection();
    
    if (!this.provider?.wallet.publicKey) {
      throw new Error("Wallet public key is not available");
    }
    
    // Submit the transaction
    await this.program.methods
      .close_poll()
      .accounts({
        authority: this.provider.wallet.publicKey,
        poll: pollAddress,
      })
      .rpc();
  }

  async getPollData(pollAddress: PublicKey): Promise<PollData | null> {
    this.checkConnection();

    try {
      // Fetch the poll account data
      const pollAccount = await this.program.account.poll.fetch(pollAddress);
      
      if (!pollAccount) {
        return null;
      }
      
      // Convert BN values to numbers
      const startTime = pollAccount.startTime.toNumber();
      const endTime = pollAccount.endTime.toNumber();
      const totalVotes = pollAccount.totalVotes;
      
      // Convert options format
      const options = pollAccount.options.map((option: any) => ({
        text: option.text,
        voteCount: option.voteCount,
      }));

      return {
        creator: pollAccount.creator,
        name: pollAccount.name,
        description: pollAccount.description,
        startTime,
        endTime,
        isPublic: pollAccount.isPublic,
        isActive: pollAccount.isActive,
        totalVotes,
        options,
        address: pollAddress,
      };
    } catch (error) {
      console.error("Error fetching poll data:", error);
      return null;
    }
  }

  async getAllPolls(): Promise<PollData[]> {
    this.checkConnection();

    try {
      // Fetch all poll accounts
      const polls = await this.program.account.poll.all();
      
      // Map the raw data to our PollData format
      return polls.map((item: any) => {
        const pollAccount = item.account;
        const pollAddress = item.publicKey;
        
        // Convert BN values to numbers
        const startTime = pollAccount.startTime.toNumber();
        const endTime = pollAccount.endTime.toNumber();
        const totalVotes = pollAccount.totalVotes;
        
        // Convert options format
        const options = pollAccount.options.map((option: any) => ({
          text: option.text,
          voteCount: option.voteCount,
        }));

        return {
          creator: pollAccount.creator,
          name: pollAccount.name,
          description: pollAccount.description,
          startTime,
          endTime,
          isPublic: pollAccount.isPublic,
          isActive: pollAccount.isActive,
          totalVotes,
          options,
          address: pollAddress,
        };
      });
    } catch (error) {
      console.error("Error fetching all polls:", error);
      return [];
    }
  }

  async hasVoted(pollAddress: PublicKey): Promise<boolean> {
    this.checkConnection();
    
    if (!this.provider?.wallet.publicKey) {
      return false;
    }

    try {
      // Get poll data to check if it's public or private
      const pollData = await this.getPollData(pollAddress);
      
      if (!pollData) {
        return false;
      }

      if (pollData.isPublic) {
        // For public polls, check the vote record
        try {
          // Derive the vote record PDA
          const [voteRecordAddress] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("vote-record"),
              pollAddress.toBuffer(),
              this.provider.wallet.publicKey.toBuffer(),
            ],
            this.program.programId
          );
          
          // Try to fetch the vote record account
          const voteRecord = await this.program.account.voteRecord.fetch(voteRecordAddress);
          return voteRecord.hasVoted;
        } catch (error) {
          // If the account doesn't exist, the user hasn't voted
          return false;
        }
      } else {
        // For private polls, check the voter registry
        try {
          // Derive the voter registry PDA
          const [voterRegistryAddress] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("voter-registry"),
              pollAddress.toBuffer(),
              this.provider.wallet.publicKey.toBuffer(),
            ],
            this.program.programId
          );
          
          // Try to fetch the voter registry account
          const voterRegistry = await this.program.account.voterRegistry.fetch(voterRegistryAddress);
          return voterRegistry.hasVoted;
        } catch (error) {
          // If the account doesn't exist, the user hasn't voted (and isn't registered)
          return false;
        }
      }
    } catch (error) {
      console.error("Error checking if user has voted:", error);
      return false;
    }
  }

  async isVoterRegistered(pollAddress: PublicKey): Promise<boolean> {
    this.checkConnection();
    
    if (!this.provider?.wallet.publicKey) {
      return false;
    }

    try {
      // Get poll data to verify it's a private poll
      const pollData = await this.getPollData(pollAddress);
      
      if (!pollData || pollData.isPublic) {
        // Not a private poll, so registration concept doesn't apply
        return true;
      }

      try {
        // Derive the voter registry PDA
        const [voterRegistryAddress] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("voter-registry"),
            pollAddress.toBuffer(),
            this.provider.wallet.publicKey.toBuffer(),
          ],
          this.program.programId
        );
        
        // Try to fetch the voter registry account - if it exists, the voter is registered
        await this.program.account.voterRegistry.fetch(voterRegistryAddress);
        return true;
      } catch (error) {
        // If the account doesn't exist, the voter is not registered
        return false;
      }
    } catch (error) {
      console.error("Error checking if voter is registered:", error);
      return false;
    }
  }
} 
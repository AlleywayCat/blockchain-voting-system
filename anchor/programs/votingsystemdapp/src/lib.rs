#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("CfU2hH8HEy6UQhiEeECeJL66112N18EuYq1khpX2N1RF");

#[program]
pub mod votingsystemdapp {
    use super::*;

    // Initialize a new voting poll
    pub fn create_poll(
        ctx: Context<CreatePoll>,
        name: String,
        description: String,
        options: Vec<String>,
        start_time: i64,
        end_time: i64,
        is_public: bool,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let creator = &ctx.accounts.creator;
        
        // Validate inputs
        require!(options.len() > 0, VotingError::InvalidPollOptions);
        require!(options.len() <= 10, VotingError::TooManyOptions);
        require!(end_time > start_time, VotingError::InvalidTimeRange);
        require!(name.len() <= 50, VotingError::NameTooLong);
        require!(description.len() <= 200, VotingError::DescriptionTooLong);
        
        // Initialize poll
        poll.creator = creator.key();
        poll.name = name;
        poll.description = description;
        poll.start_time = start_time;
        poll.end_time = end_time;
        poll.is_public = is_public;
        poll.is_active = true;
        poll.total_votes = 0;
        
        // Initialize options with zero votes
        let mut poll_options = Vec::new();
        for option in options {
            require!(option.len() <= 50, VotingError::OptionTooLong);
            poll_options.push(PollOption {
                text: option,
                vote_count: 0,
            });
        }
        poll.options = poll_options;
        
        Ok(())
    }

    // Register a voter for a specific poll (only required for private polls)
    pub fn register_voter(
        ctx: Context<RegisterVoter>,
        voter_address: Pubkey,
    ) -> Result<()> {
        let poll = &ctx.accounts.poll;
        let voter_registry = &mut ctx.accounts.voter_registry;
        
        // Verify only creator can register voters
        require!(poll.creator == ctx.accounts.authority.key(), VotingError::Unauthorized);
        
        // Check if poll is private (registration only needed for private polls)
        require!(!poll.is_public, VotingError::UnnecessaryRegistration);
        
        // Initialize voter registry
        voter_registry.poll = poll.key();
        voter_registry.voter = voter_address;
        voter_registry.has_voted = false;
        
        Ok(())
    }

    // Cast a vote on a public poll
    pub fn cast_vote_public(ctx: Context<CastVotePublic>, option_index: u8) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let voter = &ctx.accounts.voter;
        let vote_record = &mut ctx.accounts.vote_record;
        
        // Validate poll is public
        require!(poll.is_public, VotingError::WrongPollType);
        
        // Validate voting period
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        require!(current_time >= poll.start_time, VotingError::PollNotStarted);
        require!(current_time <= poll.end_time, VotingError::PollEnded);
        require!(poll.is_active, VotingError::PollInactive);
        
        // Validate option index
        require!(
            (option_index as usize) < poll.options.len(),
            VotingError::InvalidOptionIndex
        );
        
        // Check if voter has already voted
        require!(!vote_record.has_voted, VotingError::AlreadyVoted);
        
        // Initialize vote record
        vote_record.poll = poll.key();
        vote_record.voter = voter.key();
        vote_record.has_voted = true;
        
        // Update vote count
        poll.options[option_index as usize].vote_count += 1;
        poll.total_votes += 1;
        
        Ok(())
    }
    
    // Cast a vote on a private poll
    pub fn cast_vote_private(ctx: Context<CastVotePrivate>, option_index: u8) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let voter = &ctx.accounts.voter;
        let voter_registry = &mut ctx.accounts.voter_registry;
        
        // Validate poll is private
        require!(!poll.is_public, VotingError::WrongPollType);
        
        // Validate voting period
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        require!(current_time >= poll.start_time, VotingError::PollNotStarted);
        require!(current_time <= poll.end_time, VotingError::PollEnded);
        require!(poll.is_active, VotingError::PollInactive);
        
        // Validate option index
        require!(
            (option_index as usize) < poll.options.len(),
            VotingError::InvalidOptionIndex
        );
        
        // Check if voter is registered and hasn't voted yet
        require!(voter_registry.poll == poll.key(), VotingError::InvalidVoterRegistry);
        require!(voter_registry.voter == voter.key(), VotingError::Unauthorized);
        require!(!voter_registry.has_voted, VotingError::AlreadyVoted);
        
        // Mark that voter has voted
        voter_registry.has_voted = true;
        
        // Update vote count
        poll.options[option_index as usize].vote_count += 1;
        poll.total_votes += 1;
        
        Ok(())
    }

    // Close a poll (can only be done by the creator)
    pub fn close_poll(ctx: Context<ClosePoll>) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let authority = &ctx.accounts.authority;
        
        // Verify only creator can close the poll
        require!(poll.creator == authority.key(), VotingError::Unauthorized);
        
        // Deactivate the poll
        poll.is_active = false;
        
        Ok(())
    }

    // Delete a poll and recover rent (can only be done by the creator)
    pub fn delete_poll(ctx: Context<DeletePoll>) -> Result<()> {
        let poll = &ctx.accounts.poll;
        let authority = &ctx.accounts.authority;
        
        // Verify only creator can delete the poll
        require!(poll.creator == authority.key(), VotingError::Unauthorized);
        
        // Account is automatically closed and rent returned to authority
        // due to the 'close = authority' constraint in the account struct
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePoll<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + Poll::MAX_SIZE,
    )]
    pub poll: Account<'info, Poll>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterVoter<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + VoterRegistry::SIZE,
        seeds = [b"voter-registry", poll.key().as_ref(), voter_address.key().as_ref()],
        bump
    )]
    pub voter_registry: Account<'info, VoterRegistry>,
    
    #[account(constraint = poll.creator == authority.key() @ VotingError::Unauthorized)]
    pub poll: Account<'info, Poll>,
    
    /// CHECK: This is just a key used to derive the PDA
    pub voter_address: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

// Struct for casting votes on public polls
#[derive(Accounts)]
pub struct CastVotePublic<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    
    #[account(
        mut,
        constraint = poll.is_public @ VotingError::WrongPollType
    )]
    pub poll: Account<'info, Poll>,
    
    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + VoteRecord::SIZE,
        seeds = [b"vote-record", poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,
    
    pub system_program: Program<'info, System>,
}

// Struct for casting votes on private polls
#[derive(Accounts)]
pub struct CastVotePrivate<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    
    #[account(
        mut,
        constraint = !poll.is_public @ VotingError::WrongPollType
    )]
    pub poll: Account<'info, Poll>,
    
    #[account(
        mut,
        seeds = [b"voter-registry", poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub voter_registry: Account<'info, VoterRegistry>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClosePoll<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = poll.creator == authority.key() @ VotingError::Unauthorized
    )]
    pub poll: Account<'info, Poll>,
}

#[derive(Accounts)]
pub struct DeletePoll<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        close = authority, // This returns the rent to authority
        constraint = poll.creator == authority.key() @ VotingError::Unauthorized
    )]
    pub poll: Account<'info, Poll>,
}

#[account]
pub struct Poll {
    pub creator: Pubkey,
    pub name: String,
    pub description: String,
    pub start_time: i64,
    pub end_time: i64,
    pub is_public: bool,
    pub is_active: bool,
    pub total_votes: u32,
    pub options: Vec<PollOption>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PollOption {
    pub text: String,
    pub vote_count: u32,
}

impl Poll {
    pub const MAX_SIZE: usize = 8 +  // discriminator
        32 +                      // creator (Pubkey)
        4 + 50 +                  // name (String max 50 chars)
        4 + 200 +                 // description (String max 200 chars)
        8 +                       // start_time (i64)
        8 +                       // end_time (i64)
        1 +                       // is_public (bool)
        1 +                       // is_active (bool)
        4 +                       // total_votes (u32)
        4 + (10 * (4 + 50 + 4));  // options (Vector of 10 PollOptions max)
}

#[account]
pub struct VoterRegistry {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub has_voted: bool,
}

impl VoterRegistry {
    pub const SIZE: usize = 8 +   // discriminator
        32 +                    // poll (Pubkey)
        32 +                    // voter (Pubkey)
        1;                      // has_voted (bool)
}

#[account]
pub struct VoteRecord {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub has_voted: bool,
}

impl VoteRecord {
    pub const SIZE: usize = 8 +   // discriminator
        32 +                    // poll (Pubkey)
        32 +                    // voter (Pubkey)
        1;                      // has_voted (bool)
}

#[error_code]
pub enum VotingError {
    #[msg("Invalid poll options")]
    InvalidPollOptions,
    #[msg("Too many options")]
    TooManyOptions,
    #[msg("Invalid time range")]
    InvalidTimeRange,
    #[msg("Poll name too long")]
    NameTooLong,
    #[msg("Poll description too long")]
    DescriptionTooLong,
    #[msg("Option text too long")]
    OptionTooLong,
    #[msg("Unauthorized operation")]
    Unauthorized,
    #[msg("Poll has not started yet")]
    PollNotStarted,
    #[msg("Poll has already ended")]
    PollEnded,
    #[msg("Poll is inactive")]
    PollInactive,
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    #[msg("Voter has already voted")]
    AlreadyVoted,
    #[msg("Invalid voter registry")]
    InvalidVoterRegistry,
    #[msg("Registration required for private polls")]
    RegistrationRequired,
    #[msg("Registration not needed for public polls")]
    UnnecessaryRegistration,
    #[msg("Vote record not needed for private polls")]
    UnnecessaryVoteRecord,
    #[msg("Wrong poll type")]
    WrongPollType,
}

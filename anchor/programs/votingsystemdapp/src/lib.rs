#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

// Module declarations
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

// Re-exports
pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("CfU2hH8HEy6UQhiEeECeJL66112N18EuYq1khpX2N1RF");

#[program]
pub mod votingsystemdapp {
    use super::*;

    /// Initialize a new voting poll
    pub fn create_poll(
        ctx: Context<CreatePoll>,
        name: String,
        description: String,
        options: Vec<String>,
        start_time: i64,
        end_time: i64,
        is_public: bool,
    ) -> Result<()> {
        instructions::create_poll::create_poll(ctx, name, description, options, start_time, end_time, is_public)
    }

    /// Register a voter for a specific poll (only required for private polls)
    pub fn register_voter(
        ctx: Context<RegisterVoter>,
        voter_address: Pubkey,
    ) -> Result<()> {
        instructions::register_voter::register_voter(ctx, voter_address)
    }

    /// Cast a vote on a public poll
    pub fn cast_vote_public(ctx: Context<CastVotePublic>, option_index: u8) -> Result<()> {
        instructions::cast_vote_public::cast_vote_public(ctx, option_index)
    }

    /// Cast a vote on a private poll
    pub fn cast_vote_private(ctx: Context<CastVotePrivate>, option_index: u8) -> Result<()> {
        instructions::cast_vote_private::cast_vote_private(ctx, option_index)
    }

    /// Close a poll (can only be done by the creator)
    pub fn close_poll(ctx: Context<ClosePoll>) -> Result<()> {
        instructions::close_poll::close_poll(ctx)
    }

    /// Delete a poll and recover rent (can only be done by the creator)
    pub fn delete_poll(ctx: Context<DeletePoll>) -> Result<()> {
        instructions::delete_poll::delete_poll(ctx)
    }
}
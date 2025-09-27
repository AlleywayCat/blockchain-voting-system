use anchor_lang::prelude::*;
use crate::state::{Poll, VoterRegistry};
use crate::error::VotingError;

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
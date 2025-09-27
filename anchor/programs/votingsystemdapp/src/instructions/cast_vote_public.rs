use anchor_lang::prelude::*;
use crate::state::{Poll, VoteRecord};
use crate::error::VotingError;

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
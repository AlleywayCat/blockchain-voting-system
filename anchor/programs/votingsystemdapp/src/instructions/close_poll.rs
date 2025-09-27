use anchor_lang::prelude::*;
use crate::state::Poll;
use crate::error::VotingError;

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

pub fn close_poll(ctx: Context<ClosePoll>) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    let authority = &ctx.accounts.authority;

    // Verify only creator can close the poll
    require!(poll.creator == authority.key(), VotingError::Unauthorized);

    // Deactivate the poll
    poll.is_active = false;

    Ok(())
}
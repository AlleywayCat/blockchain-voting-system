use anchor_lang::prelude::*;
use crate::state::Poll;
use crate::error::VotingError;

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

pub fn delete_poll(ctx: Context<DeletePoll>) -> Result<()> {
    let poll = &ctx.accounts.poll;
    let authority = &ctx.accounts.authority;

    // Verify only creator can delete the poll
    require!(poll.creator == authority.key(), VotingError::Unauthorized);

    // Account is automatically closed and rent returned to authority
    // due to the 'close = authority' constraint in the account struct
    Ok(())
}
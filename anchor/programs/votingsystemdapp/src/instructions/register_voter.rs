use anchor_lang::prelude::*;
use crate::state::{Poll, VoterRegistry};
use crate::error::VotingError;

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
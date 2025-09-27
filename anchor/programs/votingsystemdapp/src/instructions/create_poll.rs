use anchor_lang::prelude::*;
use crate::state::{Poll, PollOption};
use crate::error::VotingError;
use crate::constants::*;

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
    require!(options.len() <= MAX_OPTIONS, VotingError::TooManyOptions);
    require!(end_time > start_time, VotingError::InvalidTimeRange);
    require!(name.len() <= MAX_NAME_LENGTH, VotingError::NameTooLong);
    require!(description.len() <= MAX_DESCRIPTION_LENGTH, VotingError::DescriptionTooLong);

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
        require!(option.len() <= MAX_OPTION_LENGTH, VotingError::OptionTooLong);
        poll_options.push(PollOption {
            text: option,
            vote_count: 0,
        });
    }
    poll.options = poll_options;

    Ok(())
}
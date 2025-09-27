use anchor_lang::prelude::*;
use crate::constants::*;

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
    pub const MAX_SIZE: usize = DISCRIMINATOR_SIZE +  // discriminator
        PUBKEY_SIZE +                                 // creator (Pubkey)
        STRING_PREFIX_SIZE + MAX_NAME_LENGTH +        // name (String max 50 chars)
        STRING_PREFIX_SIZE + MAX_DESCRIPTION_LENGTH + // description (String max 200 chars)
        8 +                                           // start_time (i64)
        8 +                                           // end_time (i64)
        1 +                                           // is_public (bool)
        1 +                                           // is_active (bool)
        4 +                                           // total_votes (u32)
        VECTOR_PREFIX_SIZE + (MAX_OPTIONS * POLL_OPTION_SIZE); // options (Vector of poll options)
}
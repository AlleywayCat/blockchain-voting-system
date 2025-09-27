use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct VoterRegistry {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub has_voted: bool,
}

impl VoterRegistry {
    pub const SIZE: usize = DISCRIMINATOR_SIZE + // discriminator
        PUBKEY_SIZE +                            // poll (Pubkey)
        PUBKEY_SIZE +                            // voter (Pubkey)
        1;                                       // has_voted (bool)
}
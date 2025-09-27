use anchor_lang::prelude::*;

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
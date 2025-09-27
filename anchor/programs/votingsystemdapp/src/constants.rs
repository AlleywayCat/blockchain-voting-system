/// Maximum number of options allowed per poll
pub const MAX_OPTIONS: usize = 10;

/// Maximum length for poll name in characters
pub const MAX_NAME_LENGTH: usize = 50;

/// Maximum length for poll description in characters
pub const MAX_DESCRIPTION_LENGTH: usize = 200;

/// Maximum length for poll option text in characters
pub const MAX_OPTION_LENGTH: usize = 50;

/// Poll account discriminator size
pub const DISCRIMINATOR_SIZE: usize = 8;

/// Pubkey size in bytes
pub const PUBKEY_SIZE: usize = 32;

/// String prefix size (4 bytes for length)
pub const STRING_PREFIX_SIZE: usize = 4;

/// Vector prefix size (4 bytes for length)
pub const VECTOR_PREFIX_SIZE: usize = 4;

/// Poll option size calculation
/// 4 bytes (text length) + 50 bytes (max text) + 4 bytes (vote_count)
pub const POLL_OPTION_SIZE: usize = STRING_PREFIX_SIZE + MAX_OPTION_LENGTH + 4;
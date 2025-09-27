/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/votingsystemdapp.json`.
 */
export type Votingsystemdapp = {
  "address": "CfU2hH8HEy6UQhiEeECeJL66112N18EuYq1khpX2N1RF",
  "metadata": {
    "name": "votingsystemdapp",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "castVotePrivate",
      "discriminator": [
        200,
        175,
        66,
        238,
        61,
        247,
        133,
        41
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true
        },
        {
          "name": "voterRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  45,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "poll"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "optionIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "castVotePublic",
      "discriminator": [
        252,
        1,
        187,
        144,
        63,
        10,
        162,
        75
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true
        },
        {
          "name": "voteRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "poll"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "optionIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "closePoll",
      "discriminator": [
        139,
        213,
        162,
        65,
        172,
        150,
        123,
        67
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "createPoll",
      "discriminator": [
        182,
        171,
        112,
        238,
        6,
        219,
        14,
        110
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "options",
          "type": {
            "vec": "string"
          }
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        },
        {
          "name": "isPublic",
          "type": "bool"
        }
      ]
    },
    {
      "name": "deletePoll",
      "discriminator": [
        156,
        80,
        237,
        248,
        65,
        44,
        143,
        152
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "registerVoter",
      "discriminator": [
        229,
        124,
        185,
        99,
        118,
        51,
        226,
        6
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "voterRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  45,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "poll"
              },
              {
                "kind": "account",
                "path": "voterAddress"
              }
            ]
          }
        },
        {
          "name": "poll"
        },
        {
          "name": "voterAddress"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "voterAddress",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "poll",
      "discriminator": [
        110,
        234,
        167,
        188,
        231,
        136,
        153,
        111
      ]
    },
    {
      "name": "voteRecord",
      "discriminator": [
        112,
        9,
        123,
        165,
        234,
        9,
        157,
        167
      ]
    },
    {
      "name": "voterRegistry",
      "discriminator": [
        146,
        143,
        24,
        89,
        70,
        216,
        173,
        189
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidPollOptions",
      "msg": "Invalid poll options"
    },
    {
      "code": 6001,
      "name": "tooManyOptions",
      "msg": "Too many options"
    },
    {
      "code": 6002,
      "name": "invalidTimeRange",
      "msg": "Invalid time range"
    },
    {
      "code": 6003,
      "name": "nameTooLong",
      "msg": "Poll name too long"
    },
    {
      "code": 6004,
      "name": "descriptionTooLong",
      "msg": "Poll description too long"
    },
    {
      "code": 6005,
      "name": "optionTooLong",
      "msg": "Option text too long"
    },
    {
      "code": 6006,
      "name": "unauthorized",
      "msg": "Unauthorized operation"
    },
    {
      "code": 6007,
      "name": "pollNotStarted",
      "msg": "Poll has not started yet"
    },
    {
      "code": 6008,
      "name": "pollEnded",
      "msg": "Poll has already ended"
    },
    {
      "code": 6009,
      "name": "pollInactive",
      "msg": "Poll is inactive"
    },
    {
      "code": 6010,
      "name": "invalidOptionIndex",
      "msg": "Invalid option index"
    },
    {
      "code": 6011,
      "name": "alreadyVoted",
      "msg": "Voter has already voted"
    },
    {
      "code": 6012,
      "name": "invalidVoterRegistry",
      "msg": "Invalid voter registry"
    },
    {
      "code": 6013,
      "name": "registrationRequired",
      "msg": "Registration required for private polls"
    },
    {
      "code": 6014,
      "name": "unnecessaryRegistration",
      "msg": "Registration not needed for public polls"
    },
    {
      "code": 6015,
      "name": "unnecessaryVoteRecord",
      "msg": "Vote record not needed for private polls"
    },
    {
      "code": 6016,
      "name": "wrongPollType",
      "msg": "Wrong poll type"
    }
  ],
  "types": [
    {
      "name": "poll",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "isPublic",
            "type": "bool"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "totalVotes",
            "type": "u32"
          },
          {
            "name": "options",
            "type": {
              "vec": {
                "defined": {
                  "name": "pollOption"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "pollOption",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "text",
            "type": "string"
          },
          {
            "name": "voteCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "voteRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poll",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "hasVoted",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "voterRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poll",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "hasVoted",
            "type": "bool"
          }
        ]
      }
    }
  ]
};

export const IDL: Votingsystemdapp = {
  "address": "CfU2hH8HEy6UQhiEeECeJL66112N18EuYq1khpX2N1RF",
  "metadata": {
    "name": "votingsystemdapp",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "castVotePrivate",
      "discriminator": [
        200,
        175,
        66,
        238,
        61,
        247,
        133,
        41
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true
        },
        {
          "name": "voterRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  45,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "poll"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "optionIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "castVotePublic",
      "discriminator": [
        252,
        1,
        187,
        144,
        63,
        10,
        162,
        75
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true
        },
        {
          "name": "voteRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "poll"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "optionIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "closePoll",
      "discriminator": [
        139,
        213,
        162,
        65,
        172,
        150,
        123,
        67
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "createPoll",
      "discriminator": [
        182,
        171,
        112,
        238,
        6,
        219,
        14,
        110
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "options",
          "type": {
            "vec": "string"
          }
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        },
        {
          "name": "isPublic",
          "type": "bool"
        }
      ]
    },
    {
      "name": "deletePoll",
      "discriminator": [
        156,
        80,
        237,
        248,
        65,
        44,
        143,
        152
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "registerVoter",
      "discriminator": [
        229,
        124,
        185,
        99,
        118,
        51,
        226,
        6
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "voterRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  45,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "poll"
              },
              {
                "kind": "account",
                "path": "voterAddress"
              }
            ]
          }
        },
        {
          "name": "poll"
        },
        {
          "name": "voterAddress"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "voterAddress",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "poll",
      "discriminator": [
        110,
        234,
        167,
        188,
        231,
        136,
        153,
        111
      ]
    },
    {
      "name": "voteRecord",
      "discriminator": [
        112,
        9,
        123,
        165,
        234,
        9,
        157,
        167
      ]
    },
    {
      "name": "voterRegistry",
      "discriminator": [
        146,
        143,
        24,
        89,
        70,
        216,
        173,
        189
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidPollOptions",
      "msg": "Invalid poll options"
    },
    {
      "code": 6001,
      "name": "tooManyOptions",
      "msg": "Too many options"
    },
    {
      "code": 6002,
      "name": "invalidTimeRange",
      "msg": "Invalid time range"
    },
    {
      "code": 6003,
      "name": "nameTooLong",
      "msg": "Poll name too long"
    },
    {
      "code": 6004,
      "name": "descriptionTooLong",
      "msg": "Poll description too long"
    },
    {
      "code": 6005,
      "name": "optionTooLong",
      "msg": "Option text too long"
    },
    {
      "code": 6006,
      "name": "unauthorized",
      "msg": "Unauthorized operation"
    },
    {
      "code": 6007,
      "name": "pollNotStarted",
      "msg": "Poll has not started yet"
    },
    {
      "code": 6008,
      "name": "pollEnded",
      "msg": "Poll has already ended"
    },
    {
      "code": 6009,
      "name": "pollInactive",
      "msg": "Poll is inactive"
    },
    {
      "code": 6010,
      "name": "invalidOptionIndex",
      "msg": "Invalid option index"
    },
    {
      "code": 6011,
      "name": "alreadyVoted",
      "msg": "Voter has already voted"
    },
    {
      "code": 6012,
      "name": "invalidVoterRegistry",
      "msg": "Invalid voter registry"
    },
    {
      "code": 6013,
      "name": "registrationRequired",
      "msg": "Registration required for private polls"
    },
    {
      "code": 6014,
      "name": "unnecessaryRegistration",
      "msg": "Registration not needed for public polls"
    },
    {
      "code": 6015,
      "name": "unnecessaryVoteRecord",
      "msg": "Vote record not needed for private polls"
    },
    {
      "code": 6016,
      "name": "wrongPollType",
      "msg": "Wrong poll type"
    }
  ],
  "types": [
    {
      "name": "poll",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "isPublic",
            "type": "bool"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "totalVotes",
            "type": "u32"
          },
          {
            "name": "options",
            "type": {
              "vec": {
                "defined": {
                  "name": "pollOption"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "pollOption",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "text",
            "type": "string"
          },
          {
            "name": "voteCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "voteRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poll",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "hasVoted",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "voterRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poll",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "hasVoted",
            "type": "bool"
          }
        ]
      }
    }
  ]
};

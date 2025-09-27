# Decentralized Voting on Solana

A decentralized application built on Solana blockchain that enables creating and participating in transparent and secure voting polls.

## Features

- **Create Voting Polls**: Create customizable polls with multiple options
- **Public & Private Polls**: Support for both public (open to anyone) and private (restricted) voting
- **Secure Voting**: Built on Solana blockchain for transparent and tamper-proof voting
- **Real-time Results**: View voting results in real-time
- **Poll Management**: Close polls, view historical results

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Blockchain**: Solana
- **Smart Contract**: Rust with Anchor framework
- **Development**: TypeScript

## Getting Started

### Prerequisites

- Node v18.18.0 or higher
- Rust v1.77.2 or higher
- Anchor CLI 0.30.1 or higher
- Solana CLI 1.18.17 or higher
- Solflare Wallet or other Solana wallet browser extension

### Installation

#### Clone the repo

```shell
git clone https://github.com/yourusername/voting-system-dapp.git
cd voting-system-dapp
```

#### Install Dependencies

```shell
pnpm install
```

#### Start the web app

```shell
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/src` - Frontend Next.js application
  - `/app` - Application pages and routes
  - `/components` - React components
  - `/lib` - Utility functions and hooks
  - `/types` - TypeScript type definitions
- `/anchor` - Solana smart contract (program)
  - `/programs/votingsystemdapp` - Main program code

## Smart Contract Features

The Solana program provides the following functionality:

- Create polls with customizable options, time ranges, and visibility settings
- Register voters for private polls
- Cast votes on both public and private polls
- Close polls after completion

## Development

### Solana Program Commands

You can use any normal anchor commands. Either move to the `anchor` directory and run the `anchor` command or prefix the
command with `pnpm`, eg: `pnpm anchor`.

#### Sync the program id:

```shell
pnpm anchor keys sync
```

#### Build the program:

```shell
pnpm anchor-build
```

#### Start the test validator with the program deployed:

```shell
pnpm anchor-localnet
```

#### Run the tests

```shell
pnpm anchor-test
```

#### Deploy to Devnet

```shell
pnpm anchor deploy --provider.cluster devnet
```

### Web Application Commands

#### Start the web app

```shell
pnpm dev
```

#### Build the web app

```shell
pnpm build
```

## Usage

1. Connect your Solana wallet
2. Create a new poll with your desired options
3. Share the poll with others
4. Vote on polls
5. View results in real-time

## License

This project is licensed under the terms specified in the LICENSE file.

## Acknowledgments

- Solana Foundation
- Anchor Framework
- Next.js Team

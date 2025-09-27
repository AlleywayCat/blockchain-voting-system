# Decentralized Voting System

A blockchain-based voting application built on Solana that enables secure, transparent, and tamper-proof voting polls.

## What is this?

This is a decentralized voting app where you can:
- Create voting polls with custom options
- Make polls public (anyone can vote) or private (restricted access)
- Vote on polls using your Solana wallet
- View real-time results
- Trust that votes are secure and transparent on the blockchain

## Quick Setup

### Prerequisites
- Node.js v18.18.0+
- A Solana wallet (like Solflare)

### Installation
1. Clone and install:
```bash
git clone https://github.com/yourusername/voting-system-dapp.git
cd voting-system-dapp
npm install
```

2. Start the app:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## How to Use

1. **Connect Wallet**: Click "Connect Wallet" and select your Solana wallet
2. **Create Poll**: Click "Create Poll", add your question and options
3. **Vote**: Browse polls and click to vote (requires wallet connection)
4. **View Results**: See live voting results and poll details

## For Developers

### Tech Stack
- **Frontend**: Next.js + React + TailwindCSS
- **Blockchain**: Solana + Anchor framework
- **Language**: TypeScript

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Blockchain commands
npm run anchor-build      # Build smart contract
npm run anchor-test       # Run tests
npm run anchor-localnet   # Start local blockchain
```

### Project Structure
```
src/           # Frontend application
anchor/        # Solana smart contract
public/        # Static assets
```

## License

MIT License - see LICENSE file for details.

🧑🏼‍🚀 Made by Nikola Lausev

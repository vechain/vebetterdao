# X-Allocation Voting Simulation Tools

This directory contains simulation tools for testing the X-Allocation Voting system, including auto-voting functionality, relayer rewards, and voter rewards claiming. These tools are designed to simulate real-world scenarios for testing and development purposes.

> Only support **local** env for now.

## Overview

The simulation tools provide testing for:

- **Auto-voting configuration and execution**
- **Relayer registration and reward claiming**
- **Voter reward distribution**
- **Gas estimation for voting operations**
- **End-to-end round simulation**

## Prerequisite

Ensure the followings contracts up to date and deployed on your local:

- XAllocationVoting (v8)
- VoterRewards (v6)
- RelayerRewardsPool (v1)
- VOT3 (v2)

## Usage Examples

### Auto-voting Simulation

```bash
# Navigate to
cd packages/lambda

# Run
yarn simulate:local:x-allocation-voting-on-behalf
```

This will initiate the following flow:

```bash
START: Auto-Voting Round Simulation
│
├─ Initialize (5 voters, admin, relayer)
│
├─ Setup Relayer
│   ├─ Check if relayer is registered
│   └─ Register relayer if needed
│
├─ Setup Voter Accounts
│   ├─ Get/create 5 seeded accounts (500 VOT3 each)
│   ├─ Store voter information in seededAccounts.json
│   └─ If newly generated accounts:
│       ├─ Start new round (snapshot voting power)
│       └─ Distribute emissions
│
├─ Get Eligible Apps
│   └─ Fetch all apps available for voting
│
├─ PHASE 1: Configure Auto-Voting
│   └─ Enable auto-voting for all 5 accounts
│
├─ PHASE 2: Start New Voting Round
│   ├─ Wait for round start
│   ├─ Distribute emissions
│   └─ Get current round ID
│
├─ PHASE 3: Cast Votes On Behalf
│   └─ Relayer casts votes for all 5 accounts
│
├─ Wait for Round to End
│   ├─ Wait for next round start
│   └─ Distribute emissions
│
├─ PHASE 4: Claim Rewards
│   └─ For each of the 5 accounts:
│       └─ Relayer claims rewards on behalf
│
└─ SIMULATION COMPLETE
```

### To Claim Rewards For A Relayer

```bash
yarn simulate:local:x-allocation-voting-relayer-claim-rewards <ROUND-ID>
```

### Generate Seeded Accounts Only

```bash
# Generate accounts without running simulation
yarn simulate:local:x-allocation-voting-seeded-accounts
```

## Configuration

### Environment Setup

Please ensure your `packages/local.ts` file is up to date.

### Account Configuration

You can check the seeded account by modifying constants in simulation files:

```typescript
const NUM_VOTERS = 10 // Number of test voters
const ACCT_OFFSET = 5 // Account index offset
const SEED_STRATEGY = SeedStrategy.FIXED // Voting power strategy - All accounts receive the same voting power (500 VOT3)
```

## Core Files

### 🏗️ `seededAccounts.ts`

Manages the creation, persistence, and reuse of test accounts with voting power for simulations.

**Key Features:**

- **Account Generation**: Creates test accounts with configurable voting power using different seeding strategies
- **Persistence**: Saves/loads account data to/from JSON files for reuse across simulations
- **Setup Automation**: Handles whitelist registration, B3TR airdrops, and VOT3 token conversion
- **Flexible Configuration**: Supports different seeding strategies (FIXED, RANDOM, etc.). We are currently using FIXED.

**Main Functions:**

```typescript
// Generate and save new seeded accounts
generateAndSaveSeededAccounts(numVoters, acctOffset, seedStrategy, performSetup)

// Load existing accounts from file
loadSeededAccountsFromFile()

// Get or create accounts (reuses existing if parameters match)
getOrCreateSeededAccounts(numVoters, acctOffset, seedStrategy, forceRegenerate)
```

**Configuration Options:**

- `numVoters`: Number of voter accounts to create
- `acctOffset`: Starting index offset for account generation
- `seedStrategy`: Voting power distribution strategy (FIXED, RANDOM, etc.)
- `performSetup`: Whether to perform full account setup (whitelist, airdrop, VOT3 conversion)

### 🤖 `simulateRoundCastVoteOnBehalf.ts`

Simulates a complete auto-voting round including relayer operations and reward claiming.

**Simulation Flow:**

1. **Relayer Setup**: Registers admin as relayer if not already registered
2. **Account Management**: Creates or loads seeded accounts with voting power
3. **Auto-voting Configuration**: Enables auto-voting for all test accounts
4. **Round Execution**: Starts new round and casts votes on behalf of users
5. **Reward Claiming**: Claims rewards for all users after round completion

**Key Features:**

- **Multi-account Support**: Handles multiple voters simultaneously
- **Relayer Integration**: Tests relayer registration and reward mechanisms
- **Error Handling**: Comprehensive error reporting for failed operations
- **Progress Tracking**: Detailed logging of each simulation phase

**Configuration Constants:**

```typescript
const ACCT_OFFSET = 5 // Account index offset
const NUM_VOTERS = 5 // Number of voting accounts
const SEED_STRATEGY = SeedStrategy.FIXED // All accounts get 500 VOT3
```

## Supporting Files

### 📁 `methods/`

#### `auto-voting.ts`

Core auto-voting functionality:

- `toggleAutoVotingAndSelectApps()`: Enable auto-voting and set app preferences
- `castVoteOnBehalfOf()`: Cast vote for a single user
- `castVoteOnBehalfOfMultiClauses()`: Batch vote casting for multiple users
- `claimRewardForUser()`: Claim rewards on behalf of users
- `configureAutoVoting()`: Configure auto-voting for multiple accounts

#### `relayers.ts`

Relayer management functions:

- `registerRelayer()`: Register a new relayer
- `isRegisteredRelayer()`: Check relayer registration status
- `isRoundRewardsClaimableForRelayer()`: Check if round rewards are claimable for a relayer
- `rewardsClaimableForRelayer()`: Get the amount of claimable rewards for a relayer in a specific round
- `claimRewardForRelayer()`: Claim rewards for a relayer for a specific round

### 🧪 Additional Simulation Scripts

#### `simulateRoundCastVote.ts`

Basic voting simulation without auto-voting features:

- Direct vote casting by individual accounts
- Simple round progression testing
- Gas estimation for voting operations

#### `simulateGas.ts`

Gas estimation utilities:

- Estimates gas costs for voting operations
- Tests transaction batching efficiency
- Helps optimize transaction parameters

## Data Persistence

### Account Data Storage

Seeded accounts are saved to `data/seededAccounts.json` with structure:

```json
{
  "accounts": [
    {
      "address": "0x...",
      "amount": "500000000000000000000",
      "vot3Balance": "500000000000000000000",
      "setupCompleted": true,
      "lastSetupDate": "2025-01-01T00:00:00.000Z"
    },
    {
      "address": "0x...",
      "amount": "500000000000000000000",
      "vot3Balance": "500000000000000000000",
      "setupCompleted": true,
      "lastSetupDate": "2025-01-01T00:00:00.000Z"
    },
    ...
  ],
  "metadata": {
    "numVoters": 5,
    "acctOffset": 5,
    "seedStrategy": 0,
    "generatedAt": "2025-01-01T00:00:00.000Z",
    "setupCompleted": true
  }
}
```

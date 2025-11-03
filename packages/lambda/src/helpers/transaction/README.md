# Batch Clause Processor

A generic, reusable utility for processing blockchain transactions in batches with automatic failure isolation and retry logic.

## Overview

The `batchClauseProcessor` provides a robust way to execute multiple blockchain operations (clauses) in batches, with features like:

- ✅ **Automatic batching** - Groups operations into configurable batch sizes
- ✅ **Failure isolation** - When a batch fails, automatically identifies which specific operations are failing
- ✅ **Automatic retry** - Retries valid operations that were in a failed batch
- ✅ **Dry-run mode** - Simulate operations without sending transactions
- ✅ **Gas estimation** - Pre-validates all operations before sending
- ✅ **Type-safe** - Generic types for working with any data structure
- ✅ **Detailed error reporting** - Captures revert reasons and VM errors

## Features

### Generic Design

Unlike the original `batchVoteProcessor`, this is **completely generic** and works with:

- Any contract function
- Any data structure
- Any clause type

You just need to provide a function that converts your data into a `Clause`.

### Intelligent Failure Handling

When a batch transaction fails:

1. The processor automatically isolates each operation
2. Tests them individually to identify which ones are failing
3. Records failed operations with detailed error information
4. Retries successful operations that were in the failed batch
5. Continues processing remaining batches

### Dry-Run Mode

Perfect for testing and debugging:

- Performs gas estimation for all operations
- Identifies which operations would fail
- Returns detailed failure reasons
- **Does not send actual transactions**
- **Does not consume gas**

## Usage

### Basic Example

```typescript
import { processBatchedClauses } from "./helpers/transaction/batchClauseProcessor"
import { Clause, Address, ABIContract } from "@vechain/sdk-core"

// Your data
const users = ["0x123...", "0x456...", "0x789..."]

// Define how to convert your data to a clause
const clauseBuilder = (user: string): Clause => {
  return Clause.callFunction(Address.of(contractAddress), ABIContract.ofAbi(myABI).getFunction("myFunction"), [
    user,
    someParam,
  ])
}

// Process in batches
const result = await processBatchedClauses(
  thor, // ThorClient instance
  users, // Array of items to process
  clauseBuilder, // Function to build clause for each item
  walletAddress, // Signer wallet address
  privateKey, // Signer private key
  10, // Batch size (default: 10)
  false, // Dry-run mode (default: false)
)

console.log(`Success: ${result.successfulExecutions}`)
console.log(`Failed: ${result.failedExecutions.length}`)
```

### With Complex Types

```typescript
interface Transfer {
  recipient: string
  amount: bigint
  token: string
}

const transfers: Transfer[] = [
  { recipient: "0x123...", amount: 1000n, token: "0xabc..." },
  { recipient: "0x456...", amount: 2000n, token: "0xdef..." },
]

const result = await processBatchedClauses(
  thor,
  transfers,
  transfer => buildTransferClause(transfer),
  walletAddress,
  privateKey,
)

// Failed executions include the full Transfer object
result.failedExecutions.forEach(failed => {
  console.log(`Failed transfer to ${failed.item.recipient}`)
  console.log(`Reason: ${failed.reason}`)
  console.log(`Amount was: ${failed.item.amount}`)
})
```

### Dry-Run Mode

```typescript
// Test without sending transactions
const result = await processBatchedClauses(
  thor,
  users,
  clauseBuilder,
  walletAddress,
  privateKey,
  10,
  true, // Enable dry-run
)

// Check what would fail
if (result.failedExecutions.length > 0) {
  console.log("These operations would fail:")
  result.failedExecutions.forEach(failed => {
    console.log(`- ${failed.item}: ${failed.reason}`)
  })
}
```

## API Reference

### `processBatchedClauses<T>`

Main function for batch processing.

**Type Parameters:**

- `T` - The type of items being processed (e.g., `string` for addresses, or a custom interface)

**Parameters:**

- `thor: ThorClient` - VeChain SDK client instance
- `items: T[]` - Array of items to process
- `clauseBuilder: (item: T) => Clause` - Function to convert each item to a Clause
- `walletAddress: string` - The wallet address used for signing
- `privateKey: string | Uint8Array` - Private key for signing transactions
- `batchSize?: number` - Number of items per batch (default: 10)
- `dryRun?: boolean` - If true, only simulates without sending (default: false)

**Returns:** `Promise<BatchResult<T>>`

```typescript
interface BatchResult<T> {
  successfulExecutions: number
  failedExecutions: FailedExecution<T>[]
  transactionIds: string[]
}

interface FailedExecution<T> {
  item: T // The original item that failed
  reason: string // Error reason from contract
  vmError?: string // VM-level error if available
}
```

### `isolateFailedExecutions<T>`

Standalone function to test which operations would fail without executing them.

**Parameters:**

- `thor: ThorClient`
- `items: T[]` - Items to test
- `clauseBuilder: (item: T) => Clause`
- `walletAddress: string`

**Returns:**

```typescript
Promise<{
  toRetry: T[] // Items that passed simulation
  definitelyFailed: FailedExecution<T>[] // Items that would fail
}>
```

## Vote-Specific Wrapper

For backwards compatibility and convenience, there's a vote-specific wrapper:

```typescript
import { processBatchedVotes } from "./helpers/xallocationvoting/batchVoteProcessor"

// Simplified API for voting operations
const result = await processBatchedVotes(
  thor,
  contractAddress,
  users, // Just pass user addresses
  roundId, // Round ID
  walletAddress,
  privateKey,
  10,
  false,
)
```

This wrapper:

- Automatically builds `castVoteOnBehalfOf` clauses
- Returns `VoteBatchResult` with `failedVotes` instead of `failedExecutions`
- Maintains backwards compatibility with existing code

## Examples

See `batchClauseProcessor.example.ts` for complete examples including:

- Batch token transfers
- Batch NFT minting
- Batch whitelist updates
- Complex multi-operation batches

## Architecture

```
┌─────────────────────────────────────────┐
│  Your Lambda / Application Code         │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  batchClauseProcessor (Generic)         │
│  - Works with any clause type           │
│  - Batch processing logic               │
│  - Failure isolation                    │
│  - Retry logic                          │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  Vote-Specific Wrapper (Optional)       │
│  - Simplified API for voting            │
│  - Backwards compatible                 │
└─────────────────────────────────────────┘
```

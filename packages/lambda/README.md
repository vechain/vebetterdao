# Lambdas for the b3tr Project

This directory contains all AWS Lambda functions for the b3tr project. These lambdas handle various backend processes, blockchain interactions, and API endpoints.

## Lambda Functions Overview

Here's a list of the current lambda functions and their primary responsibilities:

1.  **`checkEndorsements`**:
    - **Purpose**: Periodically checks and verifies the endorsements of X-Apps on the VeChain blockchain.
    - **Trigger**: Scheduled
    - **Key Operations**: Interacts with smart contracts to validate endorsement statuses and publishes notifications (e.g., to Slack) on success or failure.

2.  **`getXAppSharesTop10`**:
    - **Purpose**: Retrieves and calculates the top 10 X-App shares for the previous round from the VeChain blockchain. This data is often used to feed frontend dashboards or leaderboards (e.g., VeBetter DAO website).
    - **Trigger**: API Gateway (HTTP GET request).
    - **Key Operations**: Fetches round data, X-App IDs, shares, filters blacklisted apps, sorts by percentage, and retrieves metadata (name, logo) from IPFS.

3.  **`mintCreatorNFT`**:
    - **Purpose**: Mints a Creator NFT on the VeChain blockchain for a specified wallet address.
    - **Trigger**: API Gateway (HTTP POST request).
    - **Key Operations**: Takes a `creatorWalletAddress` in the request body, interacts with the X2EarnCreator smart contract to mint an NFT, and returns the transaction receipt.

4.  **`startRound`**:
    - **Purpose**: Initiates a new round in the VeBetterDAO ecosystem by distributing emissions, X-Allocations, and DBA rewards.
    - **Trigger**: Scheduled.
    - **Key Operations**:
      - Waits for the appropriate time to start a new round
      - Calls the `distribute` function on the Emissions contract to start the new round
      - Distributes X-Allocations to eligible X-Apps that haven't claimed their allocations
      - Distributes DBA (Dynamic Base Allocation) rewards to eligible apps from the previous round:
        - Checks if DBA Pool is deployed (gracefully skips if not)
        - Filters eligible apps based on:
          - App was eligible for voting in the round
          - App rewarded at least 1 action with proofs during the round
          - App received less than 7.5% of total votes
          - App was fully endorsed during the round (not in grace period for entire round)
        - Calls `distributeDBARewards` on the DBAPool contract with filtered app IDs
      - Sends Slack notifications for each operation (success/failure)
      - **Note**: If DBA distribution fails, the lambda still succeeds (since the primary goal of starting the round is complete)

5.  **`veBetterPassport/resetSignalCounter`**:
    - **Purpose**: Resets the signal counter for a user in the VeBetter Passport system, typically after a KYC verification or a similar process.
    - **Trigger**: API Gateway (HTTP POST request).
    - **Key Operations**: Takes a `walletAddress` in the request body.

6.  **`distributeDBA`** (Manual/Fallback - NO SCHEDULER):
    - **Purpose**: Standalone DBA distribution lambda for manual/fallback use only.
    - **Trigger**: Manual invocation only (NO automated scheduler configured).
    - **When to Use**: This lambda should ONLY be triggered manually in the following scenarios:
      - The `startRound` lambda fails after starting the round but before DBA distribution completes
      - DBA rewards need to be distributed separately for any exceptional reason
      - Testing DBA distribution in isolation
    - **Note**: DBA distribution is now integrated into the `startRound` lambda and happens automatically as part of the round start process. This standalone version serves as a fallback mechanism and should not be part of normal operations.
    - **Key Operations**:
      - Determines the previous round that needs DBA distribution
      - Checks if the round is ready and hasn't been distributed yet (via `canDistributeDBARewards`)
      - Filters eligible apps using the same criteria as `startRound`
      - Distributes DBA rewards to eligible apps
      - Sends Slack notifications on success/failure

7.  **`relayerCastVote`**:
    - **Purpose**: Automatically casts votes on behalf of users who have enabled auto-voting in the
      XAllocationVoting contract.
    - **Trigger**: Scheduled (runs 30 minutes after `startRound` to ensure the new round has started).
    - **Scheduling**:
      - **Testnet/Dev**: `cron(35 1 ? * TUE,THU,SAT *)` - 1:35 AM UTC on Tue/Thu/Sat (5 mins after
        round start at 1:30 AM)
      - **Mainnet/Prod**: `cron(10 7 ? * MON *)` - 7:10 AM UTC on Monday (30 min after round start
        at 6:40 AM)
    - **Key Operations**:
      - Retrieves the current round ID from the XAllocationVoting contract
      - Fetches the round snapshot block number
      - Queries all `AutoVotingToggled` events up to the current round snapshot to identify users with
        auto-voting enabled
      - Filters users who had auto-voting enabled at the round snapshot
      - Verifies that users are still 'active' at the round snapshot (not deactivated)
      - Casts votes on behalf of all valid users in a single batch transaction using
        `castVoteOnBehalfOf`
      - Sends Slack notifications for any invalid users detected
      - Returns transaction receipt with the number of users voted for
    - **Note**: The lambda uses a relayer wallet (stored in AWS Secrets Manager) to pay gas fees
      for voting on behalf of users

8.  **`relayerClaimReward`**:
    - **Purpose**: Automatically claims voting rewards on behalf of users who have enabled auto-voting
      in the XAllocationVoting contract.
    - **Trigger**: Scheduled (runs 5 minutes after `startRound` to claim rewards from the previous
      round).
    - **Scheduling**:
      - **Testnet/Dev**: `cron(35 1 ? * TUE,THU,SAT *)` - 1:35 AM UTC on Tue/Thu/Sat (5 mins after
        round start at 1:30 AM)
      - **Mainnet/Prod**: `cron(45 6 ? * MON *)` - 6:45 AM UTC on Monday (5 min after round start
        at 6:40 AM)
    - **Key Operations**:
      - Retrieves the current round ID from the XAllocationVoting contract
      - Fetches the previous round snapshot block number
      - Queries all `AutoVotingToggled` events up to the previous round snapshot to identify users with auto-voting enabled (active)
      - Claims rewards from the previous round for all eligible users in batches using the
        `claimReward` function on the VoterRewards contract
      - Handles batch processing with automatic failure isolation and retry logic
      - Sends Slack notifications on success or failure
      - Returns transaction receipts with the number of successful and failed claims
    - **Note**: The lambda uses the same relayer wallet as `relayerCastVote` (stored in AWS Secrets Manager) to pay gas fees for claiming rewards on behalf of users. Relayer fees are deducted from user rewards as configured in the VoterRewards V6 contract

## Development

Follow these guidelines for developing and maintaining lambdas:

1.  **Folder Structure**: Adhere to the existing folder structure. Each lambda should reside in its own subdirectory within `src/`.

    ```
    src/
    ├── checkEndorsements/
    │   └── lambda.ts
    ├── getXAppSharesTop10/
    │   └── lambda.ts
    ├── helpers/
    │   └── ... (shared utility functions)
    └── ...
    ```

2.  **Naming Conventions**: Use clear and consistent names for files and functions (e.g., `lambda.ts` for the main handler).

3.  **Local Development & Testing**:
    - **Prerequisites**: Node.js, Yarn.
    - **Environment Variables**: Create a `.env` file in the `packages/lambda` directory or higher (e.g., project root `../../.env`) for local development. Example:
      ```env
      # For local.lambda.ts files if they use it
      MNEMONIC="your test mnemonic phrase here"
      LAMBDA_ENV="testnet-staging" # Or mainnet for specific testing
      ```
    - **Local Invocation Example**: For lambdas designed for local execution (like `veBetterPassport/resetSignalCounter/local.lambda.ts`), you can run them directly using Node.js:

      ```bash
      cd packages/lambda/src/veBetterPassport/resetSignalCounter

      yarn start local.lambda
      ```

4.  **Environment Configuration (`LAMBDA_ENV`)**:
    - All lambdas are designed to be environment-aware using the `LAMBDA_ENV` environment variable.
    - Supported values:
      - `testnet-staging`: Uses testnet configurations, contract addresses, and secrets.
      - `mainnet`: Uses mainnet configurations, contract addresses, and secrets.
    - The lambda code contains functions like `getNetworkConfig()`, `getSecretsConfig()`, etc., which switch parameters based on `LAMBDA_ENV`.
    - If `LAMBDA_ENV` is not set or has an unrecognized value, it typically defaults to `testnet-staging`.

5.  **Secrets Management**:
    - Private keys and other sensitive information are fetched from AWS Secrets Manager.
    - Configuration for secret IDs and keys is also environment-dependent (see `getSecretsConfig()` in each lambda).
    - For local development requiring secrets not available in AWS for a local context (e.g. a `local.lambda.ts` using a `.env` mnemonic), ensure your local setup reflects this.

## Building Lambdas

Lambdas are written in TypeScript and need to be compiled to JavaScript before deployment.

- **Build for a specific environment**:

  ```bash
  # Defaults to testnet-staging if LAMBDA_ENV is not set
  yarn build:lambda

  # Build for testnet-staging explicitly
  LAMBDA_ENV=testnet-staging yarn build:lambda

  # Build for mainnet
  LAMBDA_ENV=mainnet yarn build:lambda
  ```

- The build process typically uses `tsc` (TypeScript Compiler) and outputs JavaScript files to a `dist` or similar directory, which is then packaged for deployment.

## Deployment

- Lambdas are hosted on AWS Lambda.
- Deployment is typically handled by the DevOps team or through CI/CD pipelines.
- Setup involves:
  - Configuring the AWS Lambda function (runtime, handler, memory, timeout).
  - Setting up API Gateway endpoints for HTTP-triggered lambdas.
  - Configuring AWS EventBridge (CloudWatch Events) for scheduled lambdas.
  - Ensuring appropriate IAM roles and permissions for accessing AWS Secrets Manager, interacting with VeChain nodes, and other AWS services.
  - Setting the `LAMBDA_ENV` environment variable in the AWS Lambda configuration.

## AWS Services Interaction

- **AWS Secrets Manager**: Used to securely store and retrieve private keys and other sensitive credentials.
- **API Gateway**: Used to expose lambdas as HTTP(S) endpoints.
- **AWS EventBridge (CloudWatch Events)**: Used to trigger lambdas on a schedule (cron jobs).
- **CloudWatch Logs**: All `console.log` outputs from the lambdas are sent to CloudWatch Logs for monitoring and debugging.

## Common Issues & Troubleshooting

- **`requestBody: null` for API Gateway Lambdas**:
  - Ensure the client is sending a `Content-Type: application/json` header.
  - Verify the request body is valid JSON.
  - Check API Gateway method integration settings (ensure it's a proxy integration and mapping is correct if not).
- **Permissions Errors**:
  - Check IAM role permissions for the lambda (e.g., `secretsmanager:GetSecretValue`, network access for blockchain interaction).
- **Transaction Reverted Errors**:
  - Check blockchain node connectivity.
  - Verify smart contract addresses and ABIs.
  - Ensure sufficient gas and correct parameters for contract calls.
  - Look at `revertReasons` and `vmErrors` in logs.
- **Incorrect Environment Behavior**:
  - Double-check the `LAMBDA_ENV` value set in the AWS Lambda configuration.

Please reach out to the DevOps team for assistance with AWS setup, deployment, or access to secrets.

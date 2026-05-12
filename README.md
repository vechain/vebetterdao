# VeBetterDAO Monorepo

![Security Checks Badge](https://github.com/vechain/b3tr/actions/workflows/security-checks.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

```
                                      #######
                                 ################
                               ####################
                             ###########   #########
                            #########      #########
          #######          #########       #########
          #########       #########      ##########
           ##########     ########     ####################
            ##########   #########  #########################
              ################### ############################
               #################  ##########          ########
                 ##############      ###              ########
                  ############                       #########
                    ##########                     ##########
                     ########                    ###########
                       ###                    ############
                                          ##############
                                    #################
                                   ##############
                                   #########
```

VeBetterDAO is the monorepo behind the [VeBetterDAO](https://governance.vebetterdao.org) ecosystem — frontend, smart contracts, indexer setup, and serverless backend, all in one place.

## What's in here

| Path | What it is |
| --- | --- |
| `apps/frontend` | Next.js 16 governance dApp |
| `packages/contracts` | VeBetterDAO Solidity smart contracts (Hardhat) |
| `packages/indexer` | Docker-compose for the [VeChain indexer](https://github.com/vechain/vechain-indexer) + MongoDB + block explorer |
| `packages/lambda` | AWS Lambda functions (round automation, relayer, NFT minting, etc.) |
| `packages/config` | Per-environment configuration and contract addresses |
| `packages/constants` | Shared constants |
| `packages/utils` | Shared utilities |

**Related repos:**

- [vebetterdao-docs](https://github.com/vechain/vebetterdao-docs) — user-facing and developer documentation
- [vechain-kit](https://github.com/vechain/vechain-kit) — React hooks & components for VeChain dApps
- [vechain-indexer](https://github.com/vechain/vechain-indexer) — blockchain indexer used by this project
- [vebetterdao-relayers-dashboard](https://github.com/vechain/vebetterdao-relayers-dashboard) — relayer analytics dashboard
- [vebetterdao-relayer-node](https://github.com/vechain/vebetterdao-relayer-node) — relayer node for auto-voting and reward claiming
- [vechain-ai-skills](https://github.com/vechain/vechain-ai-skills) — AI-ready context for VeChain development

## Why a monorepo?

Using [Turborepo](https://turbo.build/repo) + Yarn keeps everything in one place, reduces code duplication, and simplifies local development. Shared packages (config, constants, utils, linting, TypeScript config) are reused across apps and services.

## Developing with monorepo

We recommend installing the [Monorepo Workspace](https://marketplace.visualstudio.com/items?itemName=folke.vscode-monorepo-workspace) VS Code extension for a better DX.

## Setting up the dev environment

### Prerequisites

| Tool | Version / Notes |
| --- | --- |
| **Node.js** | See `.nvmrc` (currently v20.19.0) — use `nvm use` |
| **Yarn** | 1.x (classic) |
| **Docker** | With the Compose plugin (`docker compose`) |
| **Make** | Pre-installed on macOS/Linux |

### Install packages

```
nvm use
yarn install
```

### Spin up the project for development

```
cp .env.example .env
yarn dev
```

`yarn dev` delegates to [`@vechain/dev-stack`](../dev-stack), the shared local dev environment used by other VeChain projects. It idempotently brings up the shared thor-solo + mongo + indexer + block-explorer on the `vechain-thor` Docker network, deploys the VeBetterDAO contracts to solo, registers their addresses with the stack, restarts the indexer + explorer to pick up the new env, and exec's the frontend dev server.

If the contracts are already deployed and the chain is intact, the deploy step short-circuits and just re-uses `packages/config/local.ts`. The `MNEMONIC` variable must be set in the `.env` file (the default one in `.env.example` works for solo).

> **Chakra typegen:** to avoid Chakra ESLint errors on a fresh checkout (or after theme changes), run `yarn chakra:typegen` once, or `yarn chakra:typegen:watch` in a separate terminal alongside `yarn dev`.

> **First run note:** the script compiles and deploys ~30 contracts to thor-solo. **This can take up to 5 minutes.** Log lines will appear continuously — do not Ctrl-C.

To stop just this project (leaving the shared stack running for other projects):

```
yarn dev:down
```

To tear down everything (shared infra + volumes + all projects' registered addresses):

```
yarn dev:reset
```

To force a fresh redeploy of the contracts (e.g. after pulling new contract changes):

```
yarn dev:redeploy
```

### Block Explorer & Indexer (Local)

Both the block explorer and the indexer are provided by `@vechain/dev-stack` and come up automatically as part of `yarn dev`. No separate commands required.

| Service        | Port  | URL                       |
| -------------- | ----- | ------------------------- |
| Thor solo      | 8669  | http://localhost:8669     |
| Block explorer | 8088  | http://localhost:8088     |
| Indexer API    | 8089  | http://localhost:8089     |
| MongoDB        | 27017 | mongodb://localhost:27017 |

B3TR's registered config (profiles + addresses) lives at `~/.vechain-dev/config/b3tr.json` after the first successful `yarn dev`.

### Spin up the project pointing to the staging environment

```
yarn dev:staging
```

The `MNEMONIC` variable must be set in the `.env` file. Ensure the URLs in `./packages/config/testnet-staging.ts` point to the correct node.

We are using the testnet network for our staging environment.

### Spin up the project pointing to the testnet environment

```
yarn dev:testnet
```

The `MNEMONIC` variable must be set in the `.env` file. This does not require the solo node to be running locally.

## Frontend Deployment

For deployment details (environments, versioning, CI/CD, environment variables, AWS/Terraform config), see [docs/maintainers.md](docs/maintainers.md).

## Smart contracts

Contracts can be found inside `./packages/contracts` folder.
This project uses Hardhat to compile, test and deploy the contracts. By default the hardhat local network is used, but it's possible to deploy or test the contracts against vechain thor solo, vechain testnet or vechain mainnet.

### Setup

In order to test and deploy the contracts, you need to have the following environment variables set:

- `MNEMONIC`: the mnemonic of the wallet you want to use to deploy the contracts; use the mnemonic available in the `.env.example` file for testing (since that mnemonic has a lot of VTHO and VET on the solo network);

You can set these variables in the `.env` file.

Run this command to install the dependencies:

```
yarn install
```

If you want to test/deploy contracts against vechain thor solo, you need to have the shared dev-stack up. The simplest way is `yarn dev` from the repo root — it brings up thor-solo (via `@vechain/dev-stack`) and runs the deploy as part of its flow. Use `yarn dev:down` to stop and `yarn dev:reset` to wipe.

Each environment has its own configuration file under `./packages/config/contracts/envs` folder:

- `local`: used for local development with thor solo;
- `testnet-staging`: used for testing against self hosted solo node;
- `testnet`: used for testing against vechain testnet;

### Compile

To compile the contracts run from root folder:

```
yarn contracts:compile
```

### Publish

To publish contracts package to the npm `@vechain/vebetterdao-contracts`, run from the root folder:

```bash
yarn contracts:publish
```

### Test

Since we are using a monorepo structure, we can run the tests only from the root folder.

To run the tests run from root folder:

```
yarn contracts:test
```

This will run tests against the hardhat local network.

If you want to run tests against vechain thor solo, you need to have the solo node running. You can start the solo node by running:

```
make solo-up
```

Then run the tests with:

```
yarn contracts:test:thor-solo
```

### Test coverage

This project uses `solidity-coverage` to generate test coverage reports.
You can view the coverage report by running:

```
yarn test:coverage:solidity
```

This will generate a folder `coverage` in `packages/contracts` with the coverage report. Open the `index.html` file in the browser to view it.

The governance contracts are forked from the `openzeppelin-contracts` library. Although we've added custom logic and written tests for them, we haven't tested functions we didn't modify. Consequently, the coverage report for `GovernorUpgradeable` may indicate low coverage for some functions. However, you can find the actual coverage for those contracts [here](https://app.codecov.io/gh/OpenZeppelin/openzeppelin-contracts/tree/master/contracts%2Fgovernance).

### Manually deploy the contracts

1. Setup all the needed env variables inside `./packages/config/contracts/envs` folder.

2. Set the `MNEMONIC` of the wallet you want to use as deployer in the `.env` file.

3. Run the command to deploy contracts:

#### Deploy to local thor solo

```
make solo-up
```

```
yarn contracts:deploy
```

The addresses will be outputted in the console. If you want the frontend to use those addresses then copy them in the `local.ts` file inside `./packages/config/`.

#### Deploy to self hosted solo

First browse to `./packages/config/testnet-staging.ts` and set the url of your solo node in the `nodeUrl` and `urls` fields.
Then run the following command:

```
yarn contracts:deploy:testnet-staging
```

#### Deploy to testnet

Run the following command:

```
yarn contracts:deploy:testnet
```

Addresses will be outputted in the console. If you want the frontend to use those addresses then copy them in the `testnet.ts` file inside `./packages/config/`.

### Slither

Slither is running in a gha workflow every time there is any changes in the contracts folder.
It will report any issues found in the contracts.

It is possible to mark false positives by updating the `slither.config.json` file. Eg:

```json
{
  "suppressions": [
    {
      "check": "reentrancy-eth",
      "file": "contracts/B3TR.sol",
      "function": "executeTransaction(uint256)",
      "reason": "CEI done; false positive"
    }
  ]
}
```

It is possible to:

- Mark an entire function as False Positive
- Mark a specific line of code as False Positive
- Mark a number of lines as False Positive

## Verify contracts (Optional)

Optionally verify your smart contracts on Sourcify. This allows 3rd to view and independently verify all of the following:

- Source code
- Metadata
- Contract ABI
- Contract Bytecode
- Contract transaction ID

After deploying `SimpleStorage`, the console will print the address of the deployed contract. You can verify the contract on [sourcify.eth](https://repo.sourcify.dev/select-contract/):

```bash
yarn contracts:verify:mainnet <contract-address> <contract-name>
```

Read more about the verification process in the [packages/contracts/scripts/verify/README.md](packages/contracts/scripts/verify/README.md) file.

## Simulating rounds

It is possible to simulate x-app voting rounds. Simply run a clean version of the app using `make solo-down && make solo-up && yarn dev:simulation`. The simulation will only work against thor solo in your local environment.

The simulation will airdrop `B3TR` and `VTHO` to a number of accounts and then simulate all of the voting rounds. After each voting round, emissions will be distributed and voter rewards claimed. For our test accounts we will swap all B3TR for VOT3 and vote on x-apps using a random formula.

The number of accounts can be adjusted by changing the `NUM_USERS_TO_SEED` variable in `simulateRounds.ts`. If you wish to increase the number of users please ensure the voting round is sufficiently long to allow voting to complete. Roughly 50 votes will occur per block so you can use this as a rough guide. For example if you want 1000 accounts you would need at lease `1000/50 = 20` blocks. Add a health buffer to ensure there are no issues.

The seeding strategy can be adjusted by changing the `SEED_STRATEGY` variable in `simulateRounds.ts`. Supported strategies are:

- `RANDOM` - Will seed accounts within the range `5-1000` with a weighting towards selecting more accounts with values on the low end of this range
- `FIXED` - All accounts receive `500` tokens
- `LINEAR` - Accounts are seeded on an increasing linear scale `[5,10,15,20.....]`

## Generate documentation

To generate the documentation for the contracts run:

```
yarn contracts:generate-docs
```

The documentation will be generated in the `docs` folder inside `./packages/contracts`, and it's generated based on the @natspec tags in the contracts.

## Generate i18n files

To regenerate the i18n translation files run the claude skill `translate`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on branching, PR labels, testing, and code style.

## Security

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the [MIT License](LICENSE).

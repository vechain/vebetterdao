# B3TR Monorepo

![Scorecard Badge](https://github.com/vechain/b3tr/blob/feature/scorecard-action/.assets/scorecard-badge.svg)
![Security Checks Badge](https://github.com/vechain/b3tr/actions/workflows/security-checks.yml/badge.svg)

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

B3TR monorepo intended to contain everything around apps, contracts, utils and in general everything needed to setup and deploy the B3TR ecosystem

## Why a monorepo ?

Although this architecture may not be definitive and may change in the future if deemed inappropriate, monorepo is a great way to **organize everything in the same place** and at the same time, **reducing code duplication** and **simplify local development**.

Having said so, without considering the better DX, we can use it to share utils, contracts, linter and typescript configuration and more between our apps or services.

## Monorepo architecture

We're using [turbo](https://www.npmjs.com/package/turbo) and yarn to manage the monorepo. The architecture and file structure it's turbo's standard one:

- apps: Contains apps or backends and in general application layer services;
- packages: reusable and sharable code, libraries, configurations;

## Developing with monorepo

I suggest installing [this](https://marketplace.visualstudio.com/items?itemName=folke.vscode-monorepo-workspace) extension for a better DX. Not sure what's the IntelliJ's equivalent

## Setting up the dev environment

### Install packages

```
nvm use
```

```
yarn install
```

### Spin up the project for development

```
cp .env.example .env
```

> docker and the compose plugin (prev docker-compose) are required in order to run the project

```
make solo-up
```

```
yarn dev
```

If contracts are not deployed, the script will deploy them automatically. In order to this to work, the `MNEMONIC` variable need to be set in the `.env` file.

This command relies on a turbo pipeline which:

- check if the contracts specified under `./packages/config/local` have been deployed, possibly deploying them if they weren't (config is updated automatically);
- run the frontend using the updated config;

If you need to start again you can stop the frontend from running and restart thor solo by running:

```
make solo-down
```

Thor solo will persist it's state to a volume. To clear this state run:

```
make solo-clean
```

```
make solo-up
```

### Block Explorer & Indexer (Local)

The local setup includes a block explorer and indexer running against the solo network.

#### Workflow

1. `make solo-up` — starts Thor solo, insight, inspector, and block explorer
2. `yarn dev` — deploys contracts, generates `packages/config/local.ts`
3. `make indexer-up` — reads contract addresses from `local.ts`, starts MongoDB + indexer + API

#### Port Map

| Service        | Port  | Command           |
| -------------- | ----- | ----------------- |
| Thor solo node | 8669  | `make solo-up`    |
| Insight        | 8086  | `make solo-up`    |
| Inspector      | 8087  | `make solo-up`    |
| Block explorer | 8088  | `make solo-up`    |
| MongoDB        | 27017 | `make indexer-up` |
| Indexer        | 8090  | `make indexer-up` |
| Indexer API    | 8089  | `make indexer-up` |

#### URLs

- Block explorer: http://localhost:8088
- Insight: http://localhost:8086
- Inspector: http://localhost:8087
- Indexer API health: http://localhost:8089/actuator/health

#### Indexer Commands

```bash
make indexer-up      # Start indexer (requires deployed contracts)
make indexer-down    # Stop indexer services
make indexer-clean   # Stop + remove indexer volumes
```

#### Key Files

| File                                             | Purpose                                                 |
| ------------------------------------------------ | ------------------------------------------------------- |
| `packages/contracts/docker-compose.yaml`         | Solo node + block explorer                              |
| `packages/indexer/docker-compose.yaml`           | MongoDB + indexer services                              |
| `scripts/extract-local-config.sh`                | Extracts contract addresses from `local.ts` as env vars |

#### Notes

- Block explorer is built from `~/apps/block-explorer` source via Docker build context
- The indexer compose file uses the `vechain-thor` network (created by the main compose) so the indexer can reach `thor-solo:8669`
- MongoDB runs without auth (local dev only)

### Spin up the project pointing to the staging environment

```
yarn dev:staging
```

If contracts are not deployed, the script will deploy them automatically. In order to this to work, the `MNEMONIC` variable need to be set in the `.env` file.
Ensure that the urls in `./packages/config/testnet-staging.ts` are pointing to the correct solo node.

This command relies on a turbo pipeline which:

- check if the contracts specified under `./packages/config/testnet-staging` have been deployed, possibly deploying them if they weren't (config is updated automatically);
- run the frontend using the updated config;

We are using the testnet network for our staging environment.

If you need to redeploy the contracts, you will first need to change the `b3trContractAddress` in `./packages/config/testnet-staging.ts` to `0x45d5CA3f295ad8BCa291cC4ecd33382DE40E4FAc`, stop the frontend from running and then run again the command above.

### Spin up the project pointing to the testnet environment

```

yarn dev:testnet

```

If contracts are not deployed, the script will deploy them automatically. In order to this to work, the `MNEMONIC` variable need to be set in the `.env` file.

This command relies on a turbo pipeline which:

- check if the contracts specified under `./packages/config/local` have been deployed, possibly deploying them if they weren't (config is updated automatically);
- run the frontend using the updated config;

It also does not require the solo node to be running locally, as it will point to the staging environment.

## Dev Testnet environment

The dev testnet environment is a testnet that is used for testing purposes by developers that want to join VeBetter.
It is not the "testnet" environment used the first time we deployed, but a new one that is used for testing purposes.
This environment is more focused on developer ux and needs (eg: faster voting rounds, a B3TR faucet, all can see settings, priority is given to the developer's needs).

To deploy changes to this environment, merge your PR to `main`. This will automatically trigger a deployment to dev.testnet.governance.vebetterdao.org.

## Frontend App Deployment

### Environments

| Environment        | How to Deploy                                 |
| ------------------ | --------------------------------------------- |
| **Dev**            | Merge PR to `main` with version label         |
| **Staging & Beta** | Merge PR to `main` with version label         |
| **Production**     | Manual deploy from Github Actions (see below) |
| **Preview**        | Automatic for every PR                        |

### Versioning

All PRs require a version label:

- `increment:patch` - Bug fixes
- `increment:minor` - New features, backwards compatible
- `increment:major` - New features/changes, backwards incompatible

There is no longer any need to manually update the version field in package.json. Versioning is managed entirely by the git tags - all you need to do is select the appropriate label for your PR, depending on the type of changes it contains. Versions are reflected in the UI Footer as follows:

- Production:
  Version tag deployed eg `Version 1.40.2`
- Staging & Beta:
  Version tag prefixed with env eg `Version beta-v.1.40.2`
- Dev-testnet:
  Short git SHA prefixed with env eg `Version dev-2190d5e`
- Previews:
  <pull request number>-<commit sha>-<flavor> eg `Version `pr-2930-29f07d1-staging`

### Deploying to Production

There is no need to manually create Releases or tags. Releases with changelogs will be automatically generated by a successful production deployment.

1. Merge your PR to `main` with the appropriate version label
2. Verify staging and beta environments are behaving as expected with the new changes
3. Go to **Actions → Deploy Frontend - Production → Run workflow**
4. Select the version tag you want to deploy (e.g., `v.1.5.0`) from the dropdown
5. Choose `deploy` to apply

### Preview Environments

Preview environments are automatically created for every PR and posted as a comment. They are destroyed when the PR is closed.

- **PRs to `main`** → dev + staging + beta previews

### Adding Environment Variables

There are two types of environment variables:

#### Build-time Variables (non-sensitive only)

These are baked into the Docker image at build time. They must be non-sensitive as they're visible in the build logs.

To add a new build-time variable:

1. Add it to the GitHub Environment **`AWS <env> governance build-time`** for each environment (dev, staging, beta, prod)
2. Add the `ARG` and `ENV` lines to `Dockerfile`
3. Add it to the `build-args` section in `.github/workflows/build-push-ecr.yml`

Example:

```dockerfile
# Dockerfile
ARG NEXT_PUBLIC_MY_NEW_VAR
ENV NEXT_PUBLIC_MY_NEW_VAR=${NEXT_PUBLIC_MY_NEW_VAR}
```

```yaml
# build-push-ecr.yml (in build-args section)
NEXT_PUBLIC_MY_NEW_VAR=${{ vars.NEXT_PUBLIC_MY_NEW_VAR || ''}}
```

#### Runtime Variables (sensitive or non-sensitive)

These are injected at runtime from AWS SSM Parameter Store. Use these for secrets or values that differ per environment.

To add a new runtime variable:

1. Add the value to **AWS SSM Parameter Store** under the environment's prefix (e.g., `/governance/beta/MY_SECRET`)
2. Add the variable name to the environment's Terraform config:
   - Non-sensitive: add to `runtime_env_var_names` in `terraform/frontend/environments/env/<env>/<env>.yaml`
   - Sensitive: add to `runtime_env_secret_names` in the same file

Example in `beta.yaml`:

```yaml
runtime_env_var_names:
  - MY_NEW_VAR

runtime_env_secret_names:
  - MY_NEW_SECRET
```

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

If you want to test/deploy contracts against vechain thor solo, you need to have the solo node running. You can start the solo node by running:

```

make solo-up

```

Stop it by running:

```

make solo-down

```

Thor solo will persist it's state to a volume. To clear this state run:

```
make solo-clean
```

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

After publishing make sure to push your commit with latest version of contracts package and sync changes with the public repo `@vechain/vebetterdao-contracts`

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

````json

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
````

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

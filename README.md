# B3TR Monorepo

```
 _______    _______  ___________  _______
|   _  "\  /" __   )("     _   ")/"      \
(. |_)  :)(__/ _) ./ )__/  \\__/|:        |
|:     \/     /  //     \\_ /   |_____/   )
(|  _  \\  __ \_ \\     |.  |    //      /
|: |_)  :)(: \__) :\    \:  |   |:  __   \
(_______/  \_______)     \__|   |__|  \___)
```

B3TR monorepo intended to contain everything around dapps, contracts, utils and in general everything needed to setup and deploy the B3TR ecosystem

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
Ensure that the urls in `./packages/config/local.ts` are pointing to the correct solo node.

This command relies on a turbo pipeline which:

- check if the contracts specified under `./packages/config/local` have been deployed, possibly deploying them if they weren't (config is updated automatically);
- run the frontend using the updated config;

If you need to start again you can stop the frontend from running and restart thor solo by running:

```
make solo-down
```

```
make solo-up
```

### Spin up the project pointing to the staging environment

```
yarn dev:staging
```

If contracts are not deployed, the script will deploy them automatically. In order to this to work, the `MNEMONIC` variable need to be set in the `.env` file.
Ensure that the urls in `./packages/config/solo-staging.ts` are pointing to the correct solo node.

This command relies on a turbo pipeline which:

- check if the contracts specified under `./packages/config/solo-staging` have been deployed, possibly deploying them if they weren't (config is updated automatically);
- run the frontend using the updated config;

It also does not require the solo node to be running locally, as it will point to the staging environment.

If you need to redeploy the contracts, you will first need to change the `b3trContractAddress` in `./packages/config/solo-staging.ts` to `0x45d5CA3f295ad8BCa291cC4ecd33382DE40E4FAc`, stop the frontend from running and then run again the command above.

### Spin up the project pointing to the testnet environment

```

yarn dev:testnet

```

If contracts are not deployed, the script will deploy them automatically. In order to this to work, the `MNEMONIC` variable need to be set in the `.env` file.

This command relies on a turbo pipeline which:

- check if the contracts specified under `./packages/config/local` have been deployed, possibly deploying them if they weren't (config is updated automatically);
- run the frontend using the updated config;

It also does not require the solo node to be running locally, as it will point to the staging environment.

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

Each environment has its own configuration file under `./packages/config/contracts/envs` folder:

- `local`: used for local development with thor solo;
- `solo-staging`: used for testing against serlf hosted solo node;
- `testnet`: used for testing against vechain testnet;

### Compile

To compile the contracts run from root folder:

```

yarn contracts:compile

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

First browse to `./packages/config/solo-staging.ts` and set the url of your solo node in the `nodeUrl` and `urls` fields.
Then run the following command:

```

yarn contracts:deploy:solo-staging

```

#### Deploy to testnet

Run the following command:

```

yarn contracts:deploy:testnet

```

Addresses will be outputted in the console. If you want the frontend to use those addresses then copy them in the `testnet.ts` file inside `./packages/config/`.

## Simulating rounds

It is possible to simulate x-app voting rounds. Simply run a clean version of the app using `make solo-down && make solo-up && yarn dev:simulation`. The simulation will only work against thor solo in your local environment.

The simulation will airdrop `B3TR` and `VTHO` to a number of accounts and then simulate all of the voting rounds. After each voting round, emissions will be distributed and voter rewards claimed. For our test accounts we will swap all B3TR for VOT3 and vote on x-apps using a random formula.

The number of accounts can be adjusted by changing the `NUM_USERS_TO_SEED` variable in `simulateRounds.ts`. If you wish to increase the number of users please ensure the voting round is sufficiently long to allow voting to complete. Roughly 50 votes will occur per block so you can use this as a rough guide. For example if you want 1000 accounts you would need at lease `1000/50 = 20` blocks. Add a health buffer to ensure there are no issues.

The seeding strategy can be adjusted by changing the `SEED_STRATEGY` variable in `simulateRounds.ts`. Supported strategies are:

- `RANDOM` - Will seed accounts within the range `5-1000` with a weighting towards selecting more accounts with values on the low end of this range
- `FIXED` - All accounts receive `500` tokens
- `LINEAR` - Accounts are seeded on an increasing linear scale `[5,10,15,20.....]`

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
yarn dev
```

### Spin up the project pointing to the staging environment

```
yarn dev:staging
```

If contracts are not deployed, the script will deploy them automatically. In order to this to work, the `MNEMONIC` variable need to be set in the `.env` file.

This command relies on a turbo pipeline which:

- start the required docker containers (solo);
- check if the contracts specified under `./packages/config/local` have been deployed, possibly deploying them if they weren't (config is updated automatically);
- run the frontend using the updated config;

## Manually deploy the contracts

Based on the environment variable the deployment script will use the related configuration to deploy the contracts (`./packages/config/contracts/envs` folder).

Set the `MNEMONIC` of the wallet you want to use as deployer in the `.env` file.

Run this command to deploy contracts to deploy to local solo node:

```
yarn contracts:deploy
```

Run this command to deploy contracts to deploy to solo-staging:

```
yarn contracts:deploy:solo-staging
```

## Simulating rounds

It is possible to simulate x-app voting rounds. Simply run a clean version of the app using `make solo-clean && make solo-up && yarn dev:simulation`. The simulation will only work against thor solo in your local environment.

The simulation will airdrop `B3TR` and `VTHO` to a number of accounts and then simulate all of the voting rounds. After each voting round, emissions will be distributed and voter rewards claimed. For our test accounts we will swap all B3TR for VOT3 and vote on x-apps using a random formula.

The number of accounts can be adjusted by changing the `NUM_USERS_TO_SEED` variable in `simulateRounds.ts`. If you wish to increase the number of users please ensure the voting round is sufficiently long to allow voting to complete. Roughly 50 votes will occur per block so you can use this as a rough guide. For example if you want 1000 accounts you would need at lease `1000/50 = 20` blocks. Add a health buffer to ensure there are no issues.

The seeding strategy can be adjusted by changing the `SEED_STRATEGY` variable in `simulateRounds.ts`. Supported strategies are:

- `RANDOM` - Will seed accounts within the range `5-1000` with a weighting towards selecting more accounts with values on the low end of this range
- `FIXED` - All accounts receive `500` tokens
- `LINEAR` - Accounts are seeded on an increasing linear scale `[5,10,15,20.....]`

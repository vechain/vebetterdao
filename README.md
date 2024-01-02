## B3TR Monorepo

B3TR monorepo intended to contain everything around dapps, contracts, utils and in general everything needed to setup and deploy the B3TR ecosystem

### Why a monorepo ?

Although this architecture may not be definitive and may change in the future if deemed inappropriate, monorepo is a great way to **organize everything in the same place** and at the same time, **reducing code duplication** and **simplify local development**.

Having said so, without considering the better DX, we can use it to share utils, contracts, linter and typescript configuration and more between our apps or services.

### Monorepo architecture

We're using [turbo](https://www.npmjs.com/package/turbo) and yarn to manage the monorepo. The architecture and file structure it's turbo's standard one:

- apps: Contains apps or backends and in general application layer services;
- packages: reusable and sharable code, libraries, configurations;

### Developing with monorepo

I suggest installing [this](https://marketplace.visualstudio.com/items?itemName=folke.vscode-monorepo-workspace) extension for a better DX. Not sure what's the IntelliJ's equivalent

### Setting up the dev environment

#### Install packages

```
nvm use
```

```
yarn install
```

#### Spin up thor-solo

This step requires you to have Docker installed

```
make solo-up
```

And to take is down again

```
make solo-down
```

#### Deploy the contracts

```
yarn hardhat:deploy
```

By default it will deploy to the solo node.
You can change the network by adding the `--network` flag. For example, to deploy to the testnet, run `yarn hardhat:deploy --network vechain_testnet`.
If you are not deploying to the solo node, you will need to import the `MNEMONIC` environment variable which will be used to deploy the contracts. Just copy the `.env.example` in file in `packages/contracts` to `.env` and set the `MNEMONIC` variable.

#### Add the contract address in the .env

Create a new env file starting from the existing template using

`cp .env.example .env`

```
NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_VOT3_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_NODE_URL=http://localhost:8669
NEXT_PUBLIC_NETWORK_TYPE=solo
```

Override `NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS` and `NEXT_PUBLIC_VOT3_CONTRACT_ADDRESS` with the addresses outputted in the previous step.
`NEXT_PUBLIC_NODE_URL` and `NEXT_PUBLIC_NETWORK_TYPE` define the network config using by the dapp, and should match the network where the contract are deployed
Values defined in `.env.example` are good for local development using solo.

#### Run the dev server

```
yarn dev
```

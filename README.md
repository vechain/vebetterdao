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
make run-solo
```

#### Deploy the contracts

```
yarn hardhat:deploy
```

#### Add the contract address in the .env

Copy the address printed in console in the previous step and create new `.env` file with the following key:

```
NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS=0x.....
```

#### Run the dev server

```
yarn dev
```

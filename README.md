## B3TR Monorepo

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

#### Spin up the project for development

```
cp .env.example .env
```

> docker and the compose plugin (prev docker-compose) are required in order to run the project

```
yarn dev
```

#### Spin up the project pointing to the staging environment

```
yarn dev:staging
```

If contracts are not deployed, the script will deploy them automatically. In order to this to work, the `MNEMONIC` variable need to be set in the `.env` file.

This command relies on a turbo pipeline which:

- start the required docker containers (solo);
- check if the contracts specified under `./packages/config/local` have been deployed, possibly deploying them if they weren't (config is updated automatically);
- run the frontend using the updated config;

### Manually deploy the contracts

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


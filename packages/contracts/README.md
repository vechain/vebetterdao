## B3TR Contracts

### Overview

This repository contains the smart contracts for the B3TR project.
`Hardhat` and `Thor Solo node` is used as the development environment.

## Setup

### Requirements

```
yarn
node: ^16.20 || ^18.16 || >=20
docker
docker-compose
```

### Local development setup

1. Install dependencies

   ```
   yarn install
   ```

2. Start solo node

   ```
   yarn start-solo
   ```

   You can add flags to the command to customize the solo node. For example, to start the solo node in background mode, run `yarn start-solo -d`.
   Other command line options can be found [here](https://docs.vechain.org/start-building/tutorials/how-to-run-a-thor-solo-node).

3. Compile contracts

   ```
   yarn compile
   ```

   Compiled contracts will be placed in the `artifacts` folder.

4. Run tests

   ```
    yarn test
   ```

   By default the tests will run against the solo node so the solo node has to be up and running locally.
   You can change the network by adding the `--network` flag. For example, to run the tests against the testnet, run `yarn test --network vechain_testnet`.

5. Deploy

   ```
   yarn deploy
   ```

   This command will automatically execute the `deploy.ts` script in the `scripts` folder. You can customize the script to deploy your contracts.
   By default it will deploy to the solo node.
   You can change the network by adding the `--network` flag. For example, to deploy to the testnet, run `yarn deploy --network vechain_testnet`.
   If you are not deploying to the solo node, you will need to import the `MNEMONIC` environment variable which will be used to deploy the contracts. Just copy the `.env.example` file to `.env` and set the `MNEMONIC` variable.

## Additional features

### Fee delegation

Fee delegation can be configured by providing optional `delegate` config which has required `url` and optional `signer` field. Url needs to point to delegation a valid
delegation service, for example `https://sponsor-testnet.vechain.energy/by/${projectId}`.

```js
module.exports = {
  solidity: {
    version: "0.8.17",
  },
  networks: {
    vechain: {
      url: "https://testnet.veblocks.net/",
      delegate: {
        url: "${feeDelegationServiceUrl}",
        signer: "${optionalSigner}",
      },
    },
  },
};
```

### Clauses support

Vechain Thor network supports sending multiple clauses as part of one transaction. Clauses are then executed atomically on
a chain. Hardhat plugin supports Vechain tx construction with multiple clauses. Example code:

```js
const clauseBuilder = new ClausesBuilder(baseContract);
const tx = await clauseBuilder
  .withClause({
    args: [1],
    abi: JSON.stringify([{ type: "function", name: "method1" }]),
    method: "method1",
  })
  .withClause({
    args: [2],
    abi: JSON.stringify([{ type: "function", name: "method2" }]),
    method: "method2",
  })
  .send();
```

### Insigth explorer

If you need to inspect the transaction, you can use the `insight` explorer. We recomend using [this](https://github.com/vechainfoundation/rewards-insight-app/tree/main) repo since it handles the solo network.

Just clone the repository, run `npm install`, update the `.env` file to point to your local solo node and run `npm serve`.

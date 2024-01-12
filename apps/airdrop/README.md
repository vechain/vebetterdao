## Airdrop facility

### Overview

A tool for airdropping B3tr tokens to multiple users.

### Configuring .env file

First you must create a `.env` file in the root of the app. `.env.template` can be used as a guide for this. You must provide values for the following:

- `AIRDROP_TYPE` - The type of airdrop to perform (mint or transfer)
- `NEXT_PUBLIC_NETWORK_TYPE` - What network to connect to
- `INPUT_FILE` - The location of a file containing the addresses and amounts to airdrop
- `SIGNING_PK` - The private key to sign the transactions with _(must be in hex format)_

Optional:

- `GAS_PRICE_COEF` - The gas price coefficient _(defaults to 0 if omitted)_
- `MAX_CLAUSES_PER_TX` - The max number of clauses per transaction _(defaults to 100 if omitted)_

### Setting up input file

The airdrop expects an input file as referenced by the `INPUT_FILE` env variable. This file contains the addresses and amounts for each airdrop recipient. See `input.json.template` for details of the structure of this file.

### Running

When you have configured the application correctly simply run `yarn install` followed by `yarn airdrop` to run the airdrop. You should run this from the root of the monorepo. Turbo will ensure that the thor solo is running and the contracts have been deployed.

### Troubleshooting

This facility is currently using a pre-release version of the [vechain-sdk](https://github.com/vechainfoundation/vechain-sdk/tree/main). This means we require some extra configuration to pull the packages that are stored in a private repo on github. First you will need read permission on the sdk project.

Next create a access token on github with read:package permissions on [vechain-sdk](https://github.com/vechainfoundation/vechain-sdk/tree/main)

Finally run `npm login --scope=@vechain --auth-type=legacy --registry=https://npm.pkg.github.com` using your username and and token as the password.

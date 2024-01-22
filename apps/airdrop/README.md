## Airdrop facility

### Overview

A tool for airdropping B3tr tokens to multiple users.

### Setting up input file

The airdrop expects an input file as referenced by the `INPUT_FILE` env variable. This file contains the addresses and amounts for each airdrop recipient. See `input.json.template` for details of the structure of this file.

### Running

To ensure you are using the correct node version run `nvm use`. Run `yarn install` to ensure the dependencies are installed correctly.

The airdrop facility can be run either via a `CLI` or using environment variables.

#### Command Line Interface (CLI)

When you run the airdrop in CLI mode, you will be prompted to enter the relevant details for the airdrop. Simply run `yarn cli` and follow the instructions.

#### Env Variables

The CLI is appropriate when we are running the airdrop locally. However we may want to automate the airdrop. In this scenario it makes sense to configure the airdrop via a env variables instead. Simply create a `.env` file from the `.env.template` file contained in the repo and configure the values as you wish. Then run the airdrop with `yarn airdrop`.

### Troubleshooting

This facility is currently using a pre-release version of the [vechain-sdk](https://github.com/vechainfoundation/vechain-sdk/tree/main). This means we require some extra configuration to pull the packages that are stored in a private repo on github. First you will need read permission on the sdk project.

Next create a access token on github with read:package permissions on [vechain-sdk](https://github.com/vechainfoundation/vechain-sdk/tree/main)

Finally run `npm login --scope=@vechain --auth-type=legacy --registry=https://npm.pkg.github.com` using your username and and token as the password.

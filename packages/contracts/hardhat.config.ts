import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { VECHAIN_URL_SOLO } from "@vechain/hardhat-vechain"
import { HardhatUserConfig } from "hardhat/config"

import "@nomicfoundation/hardhat-toolbox"
import "@nomiclabs/hardhat-truffle5"
import "@vechain/hardhat-ethers"
import "@vechain/hardhat-vechain"
import "hardhat-contract-sizer"
import "hardhat-ignore-warnings"
import "solidity-coverage"
import "solidity-docgen"

const config: HardhatUserConfig = {
  solidity: "0.8.20",
}

const getEnvMnemonic = () => {
  const isStagingEnv = process.env.NEXT_PUBLIC_APP_ENV === "testnet-staging"

  const mnemonic = isStagingEnv ? process.env.TESTNET_STAGING_MNEMONIC : process.env.MNEMONIC

  return mnemonic ?? ""
}

const getSoloUrl = () => {
  const url = process.env.NEXT_PUBLIC_APP_ENV
    ? getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig).network.urls[0]
    : VECHAIN_URL_SOLO
  return url
}

module.exports = {
  solidity: {
    version: "0.8.20",
    evmVersion: "paris",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      // viaIR: true, // Enable IR-based compilation
    },
  },
  gasReporter: {
    enabled: false,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  mocha: {
    timeout: 1800000,
    grep: process.env.SHARD || undefined,
  },
  defaultNetwork: process.env.IS_TEST_COVERAGE ? "hardhat" : "vechain_solo",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    vechain_solo: {
      url: getSoloUrl(),
      accounts: {
        mnemonic: getEnvMnemonic(),
        count: 20,
        path: "m/44'/818'/0'/0",
      },
      restful: true,
      gas: 10000000,
    },
    vechain_testnet: {
      url: getConfig().nodeUrl,
      accounts: {
        mnemonic: getEnvMnemonic(),
        count: 20,
        path: "m/44'/818'/0'/0",
      },
      restful: true,
      gas: 10000000,
    },
    vechain_mainnet: {
      url: getConfig().nodeUrl,
      accounts: {
        mnemonic: getEnvMnemonic(),
        count: 20,
        path: "m/44'/818'/0'/0",
      },
      restful: true,
      gas: 10000000,
    },
  },
  docgen: {
    pages: "files",
  },
}

export default config

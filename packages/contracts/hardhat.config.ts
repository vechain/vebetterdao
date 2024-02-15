import { VECHAIN_URL_SOLO, VECHAIN_URL_MAINNET, VECHAIN_URL_TESTNET } from "@vechain/hardhat-vechain"
import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@nomiclabs/hardhat-truffle5"
import "@vechain/hardhat-vechain"
import "@vechain/hardhat-ethers"
import { getConfig } from "@repo/config"

const soloUrl = getConfig().network.urls[0]

const config: HardhatUserConfig = {
  solidity: "0.8.20",
}

module.exports = {
  solidity: {
    version: "0.8.20",
    evmVersion: "paris",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  mocha: {
    timeout: 180000,
  },
  defaultNetwork: "vechain_solo",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    vechain_solo: {
      url: soloUrl,
      accounts: {
        mnemonic: "denial kitchen pet squirrel other broom bar gas better priority spoil cross",
        count: 10,
        path: "m/44'/818'/0'/0",
      },
      restful: true,
      gas: 10000000,
    },
    vechain_testnet: {
      url: VECHAIN_URL_TESTNET,
      accounts: {
        mnemonic: process.env.MNEMONIC || "",
        count: 10,
        path: "m/44'/818'/0'/0",
      },
      restful: true,
      gas: 10000000,
    },
    vechain_mainnet: {
      url: VECHAIN_URL_MAINNET,
      accounts: {
        mnemonic: process.env.MNEMONIC || "",
        count: 1,
        path: "m/44'/818'/0'/0",
      },
      restful: true,
      gas: 10000000,
    },
  },
}

export default config

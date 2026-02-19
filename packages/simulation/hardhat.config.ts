import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@vechain/sdk-hardhat-plugin"
import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { getMnemonic } from "@vechain/vebetterdao-contracts/scripts/helpers/env"
import { HDKey } from "@vechain/sdk-core"

const getSoloUrl = () => {
  return process.env.NEXT_PUBLIC_APP_ENV
    ? getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig).network.urls[0]
    : "http://localhost:8669"
}

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  defaultNetwork: "vechain_solo",
  networks: {
    vechain_solo: {
      url: getSoloUrl(),
      accounts: {
        mnemonic: getMnemonic(false),
        count: 20,
        path: HDKey.VET_DERIVATION_PATH,
      },
      gas: 10000000,
    },
  },
  paths: {
    artifacts: "../contracts/artifacts",
    cache: "../contracts/cache",
  },
}

export default config

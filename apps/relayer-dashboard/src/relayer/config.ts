import { getConfig } from "@repo/config"
import type { EnvConfig } from "@repo/config/contracts"

import { NetworkConfig } from "./types"

export function getNetworkConfig(): NetworkConfig {
  const env = (process.env.NEXT_PUBLIC_APP_ENV ?? "mainnet") as EnvConfig
  const config = getConfig(env)

  const nodeUrl = env === "mainnet" ? "https://mainnet.vechain.org" : "https://testnet.vechain.org"

  return {
    name: env,
    nodeUrl,
    xAllocationVotingAddress: config.xAllocationVotingContractAddress,
    voterRewardsAddress: config.voterRewardsContractAddress,
    relayerRewardsPoolAddress: config.relayerRewardsPoolContractAddress,
  }
}

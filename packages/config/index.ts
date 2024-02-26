import localConfig from "./local"
import stagingConfig from "./solo-staging"
import testnetConfig from "./testnet"
import { getContractsConfig } from "./contracts"
import { Network } from "@repo/constants"

export type AppConfig = {
  basePath?: string
  mixPanelProjectToken?: string
  b3trContractAddress: string
  vot3ContractAddress: string
  b3trGovernorAddress: string
  timelockContractAddress: string
  xAllocationPoolContractAddress: string
  xAllocationVotingContractAddress: string
  emissionsContractAddress: string
  voterRewardsContractAddress: string
  nftBadgeContractAddress: string
  nodeUrl: string
  network: Network
}

export const getConfig = (env?: string): AppConfig => {
  const appEnv = env || process.env.NEXT_PUBLIC_APP_ENV
  if (!appEnv) throw new Error("NEXT_PUBLIC_APP_ENV env variable must be set or a type must be passed to getConfig()")
  if (appEnv === "local") return localConfig
  if (appEnv === "solo-staging") return stagingConfig
  if (appEnv === "testnet") return testnetConfig
  throw new Error(`Unsupported NEXT_PUBLIC_APP_ENV ${appEnv}`)
}

export { getContractsConfig }

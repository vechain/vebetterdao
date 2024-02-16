import localConfig from "./local"
import stagingConfig from "./solo-staging"
import { Network } from "@repo/constants"

export type AppConfig = {
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
  const appEnv = env || process.env.ENV
  if (!appEnv) throw new Error("ENV env variable must be set or a type must be passed to getConfig()")
  if (appEnv === "local") return localConfig
  if (appEnv === "solo-staging") return stagingConfig
  throw new Error(`Unsupported ENV ${appEnv}`)
}

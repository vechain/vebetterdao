import localConfig from "./local"
import stagingConfig from "./solo-staging"
import { Network } from "@repo/constants"
import { contractsConfig } from "./contracts"

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

export const getConfig = (type?: string): AppConfig => {
  const networkType = type ?? contractsConfig.NEXT_PUBLIC_NETWORK_TYPE
  if (!networkType)
    throw new Error("NEXT_PUBLIC_NETWORK_TYPE env variable must be set or a type must be passed to getConfig()")
  if (networkType === "solo") return localConfig
  if (networkType === "solo-staging") return stagingConfig
  throw new Error(`Unsupported NEXT_PUBLIC_NETWORK_TYPE ${networkType}`)
}

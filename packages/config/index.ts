import { Network } from "@repo/constants"
import { localConfig } from "./local"

export type Config = {
  b3trContractAddress: string
  vot3ContractAddress: string
  governorContractAddress: string
  timelockContractAddress: string
  xAllocationPoolContractAddress: string
  xAllocationVotingContractAddress: string
  nodeUrl: string
  network: Network
}

export const getConfig = (type?: string): Config => {
  const networkType = type ?? process.env.NEXT_PUBLIC_NETWORK_TYPE
  if (!networkType)
    throw new Error("NEXT_PUBLIC_NETWORK_TYPE env variable must be set or a type must be passed to getConfig()")
  if (networkType === "solo") return localConfig
  throw new Error(`Unsupported NEXT_PUBLIC_NETWORK_TYPE ${networkType}`)
}

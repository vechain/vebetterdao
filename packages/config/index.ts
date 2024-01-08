import { Network } from "@repo/constants"
import { localConfig } from "./local"

export type Config = {
  b3trContractAddress: string
  vot3ContractAddress: string
  governorContractAddress: string
  timelockContractAddress: string
  nodeUrl: string
  network: Network
}

const getConfig = (): Config => {
  const networkType = process.env.NEXT_PUBLIC_NETWORK_TYPE
  if (!networkType) throw new Error("NEXT_PUBLIC_NETWORK_TYPE env variable is not set")
  if (networkType === "solo") return localConfig
  throw new Error(`Unsupported NEXT_PUBLIC_NETWORK_TYPE ${networkType}`)
}

// return the correct config based on the network type (NEXT_PUBLIC_NETWORK_TYPE)
export const config = getConfig()

import { localConfig } from "./local"

export type Config = {
  b3trContractAddress: string
  vot3ContractAddress: string
  nodeUrl: string
  networkType: "main" | "test" | "solo"
}

const getConfig = (): Config => {
  const networkType = process.env.NETWORK_TYPE
  if (!networkType) throw new Error("NETWORK_TYPE env variable is not set")
  if (networkType === "solo") return localConfig
  throw new Error(`Unsupported NETWORK_TYPE ${networkType}`)
}

export const config = getConfig()

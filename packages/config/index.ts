import { Network } from "@repo/constants"
import { localConfig } from "./local"
import Vot3ContractJson from "@repo/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import B3trContractJson from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
import GovernorContractJson from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
import TimelockContractJson from "@repo/contracts/artifacts/contracts/governance/Timelock.sol/Timelock.json"

export type Config = {
  b3trContractAddress: string
  vot3ContractAddress: string
  governorContractAddress: string
  timelockContractAddress: string
  nodeUrl: string
  network: Network
  governanceAvailableContracts: ExecutorAvailableContracts[]
}

type ExecutorAvailableContracts = {
  abi: typeof B3trContractJson | typeof Vot3ContractJson | typeof GovernorContractJson | typeof TimelockContractJson
  address: string
}

const getGovernanceAvailableContracts = (config: Config): ExecutorAvailableContracts[] => [
  { abi: B3trContractJson, address: config.b3trContractAddress },
  { abi: Vot3ContractJson, address: config.vot3ContractAddress },
  { abi: GovernorContractJson, address: config.governorContractAddress },
  { abi: TimelockContractJson, address: config.timelockContractAddress },
]

export const getConfig = (type?: string): Config => {
  const networkType = type ?? process.env.NEXT_PUBLIC_NETWORK_TYPE
  if (!networkType)
    throw new Error("NEXT_PUBLIC_NETWORK_TYPE env variable must be set or a type must be passed to getConfig()")
  if (networkType === "solo")
    return { ...localConfig, governanceAvailableContracts: getGovernanceAvailableContracts(localConfig) }
  throw new Error(`Unsupported NEXT_PUBLIC_NETWORK_TYPE ${networkType}`)
}

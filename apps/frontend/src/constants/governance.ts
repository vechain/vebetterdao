import {
  B3trContractJson,
  GovernorContractJson,
  TimeLockContractJson,
  Vot3ContractJson,
  XAllocationPoolJson,
  XAllocationVotingJson,
  VoterRewardsContractJson,
  B3trBadgeContractJson,
  EmissionsContractJson,
} from "@repo/contracts"

import { getConfig } from "@repo/config"

const config = getConfig()

export type ExecutorAvailableContracts = {
  abi: typeof B3trContractJson | typeof Vot3ContractJson | typeof GovernorContractJson | typeof TimeLockContractJson
  address: string
}

export const governanceAvailableContracts: ExecutorAvailableContracts[] = [
  { abi: B3trContractJson, address: config.b3trContractAddress },
  { abi: Vot3ContractJson, address: config.vot3ContractAddress },
  { abi: GovernorContractJson, address: config.governorContractAddress },
  { abi: TimeLockContractJson, address: config.timelockContractAddress },
  { abi: XAllocationPoolJson, address: config.xAllocationPoolContractAddress },
  { abi: XAllocationVotingJson, address: config.xAllocationVotingContractAddress },
  { abi: VoterRewardsContractJson, address: config.voterRewardsContractAddress },
  { abi: B3trBadgeContractJson, address: config.nftBadgeContractAddress },
  { abi: EmissionsContractJson, address: config.emissionsContractAddress },
]

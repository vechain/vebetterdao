import {
  B3trContractJson,
  B3TRGovernorJson,
  TimeLockContractJson,
  Vot3ContractJson,
  XAllocationPoolJson,
  XAllocationVotingJson,
  VoterRewardsContractJson,
  GalaxyMemberContractJson,
  EmissionsContractJson,
} from "@repo/contracts"

import { getConfig } from "@repo/config"

const config = getConfig()

export type ExecutorAvailableContracts = {
  abi: typeof B3trContractJson | typeof Vot3ContractJson | typeof B3TRGovernorJson | typeof TimeLockContractJson
  address: string
}

export const governanceAvailableContracts: ExecutorAvailableContracts[] = [
  { abi: B3trContractJson, address: config.b3trContractAddress },
  { abi: Vot3ContractJson, address: config.vot3ContractAddress },
  { abi: B3TRGovernorJson, address: config.b3trGovernorAddress },
  { abi: TimeLockContractJson, address: config.timelockContractAddress },
  { abi: XAllocationPoolJson, address: config.xAllocationPoolContractAddress },
  { abi: XAllocationVotingJson, address: config.xAllocationVotingContractAddress },
  { abi: VoterRewardsContractJson, address: config.voterRewardsContractAddress },
  { abi: GalaxyMemberContractJson, address: config.galaxyMemberContractAddress },
  { abi: EmissionsContractJson, address: config.emissionsContractAddress },
]

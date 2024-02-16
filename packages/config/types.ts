import { NEXT_PUBLIC_NETWORK_TYPE } from "@repo/constants"
import { Network } from "@repo/constants"

export type ContractsConfig = {
  NEXT_PUBLIC_NETWORK_TYPE: NEXT_PUBLIC_NETWORK_TYPE

  B3TR_GOVERNOR_QUORUM_PERCENTAGE: number
  B3TR_GOVERNOR_MIN_DELAY: number
  B3TR_GOVERNOR_VOTING_PERIOD: number
  B3TR_GOVERNOR_VOTING_DELAY: number
  B3TR_GOVERNOR_PROPOSAL_THRESHOLD: number

  EMISSIONS_CYCLE_DURATION: number
  EMISSIONS_INITIAL_EMISSIONS: number
  EMISSIONS_X_ALLOCATION_DECAY_PERCENTAGE: number
  EMISSIONS_VOTE_2_EARN_DECAY_PERCENTAGE: number
  EMISSIONS_X_ALLOCATION_DECAY_PERIOD: number
  EMISSIONS_VOTE_2_EARN_ALLOCATION_DECAY_PERIOD: number
  EMISSIONS_TREASURY_PERCENTAGE: number
  EMISSIONS_MAX_VOTE_2_EARN_DECAY_PERCENTAGE: number

  X_ALLOCATION_VOTING_QUORUM_PERCENTAGE: number

  X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE: number
  X_ALLOCATION_POOL_APP_SHARES_MAX_CAP: number

  CONTRACTS_ADMIN_ADDRESS: string

  VOTE_2_EARN_POOL_ADDRESS: string
  TREASURY_POOL_ADDRESS: string

  INITIAL_X_ALLOCATION: number
  INITIAL_VOTE_2_EARN_ALLOCATION: number
  INITIAL_TREASURY_ALLOCATION: number
}

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

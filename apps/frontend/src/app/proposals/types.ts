import { ProposalType } from "@/hooks/proposals/grants/types"

export interface ProposalCreatedEvent {
  proposalId: bigint
  proposer: string
  targets: string[]
  // values: bigint[]
  // signatures: string[]
  calldatas: string[] // bytes[]
  description: string
  roundIdVoteStart: bigint
  depositThreshold: bigint

  blockID: string
  blockNumber: number
  blockTimestamp: number
  txID: string
  txOrigin: string
  clauseIndex: number
}

export interface ProposalDetail extends ProposalCreatedEvent {
  type: ProposalType
  state: number
  votes: VoteEntry[]
  metadata: ProposalMetadata
}

export type VoteSupport = "FOR" | "AGAINST" | "ABSTAIN"

export interface VoteEntry {
  proposalId: string
  support: VoteSupport
  voters: number
  totalWeight: bigint
  totalPower: bigint
}

export interface ProposalMetadata {
  title: string
  shortDescription: string
  markdownDescription: string
}

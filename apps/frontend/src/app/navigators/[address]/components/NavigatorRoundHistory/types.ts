import { type RoundVote } from "../NavigatorRoundVotesCard"

/** `pending` = round voting period not over yet (not a compliance failure). */
export type TaskStatus = "done" | "late" | "missed" | "pending"

/** Report row: open round, interval does not require a report yet, none submitted */
export type ReportRowStatus = TaskStatus | "notDue" | "optionalOpen"

export type ProposalTask = {
  proposalId: string
  title: string
  status: TaskStatus
}

export type RoundCompliance = {
  roundId: string
  voteStart: number
  voteEnd: number
  /** Matches XAllocation `state`: Active while `currentBlock <= voteEnd`. */
  isRoundStillOpen: boolean
  allocationStatus: TaskStatus
  proposals: ProposalTask[]
  reportSubmitted: boolean
  reportDue: boolean
  reportURI?: string
}

export type { RoundVote }

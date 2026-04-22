import { ChallengeDetail, ChallengeView } from "../types"

export const CHALLENGES_PAGE_SIZE = 12 as const

export interface PaginationArgs {
  page?: number
  size?: number
}

export interface Pagination {
  hasNext: boolean
  cursor?: string | null
}

export interface ChallengePage {
  data: ChallengeView[]
  pagination: Pagination
}

export interface ChallengesDataSource {
  getNeededActions(viewer: string, args?: PaginationArgs): Promise<ChallengePage>
  getUserChallenges(viewer: string, args?: PaginationArgs): Promise<ChallengePage>
  getOpenToJoin(viewer: string | undefined, args?: PaginationArgs): Promise<ChallengePage>
  getWhatOthersAreDoing(viewer: string | undefined, args?: PaginationArgs): Promise<ChallengePage>
  getHistory(viewer: string, args?: PaginationArgs): Promise<ChallengePage>
  getChallengeDetail(id: number, viewer?: string): Promise<ChallengeDetail | null>
}

export type ChallengeSectionKey = "neededActions" | "userChallenges" | "openToJoin" | "whatOthersAreDoing" | "history"

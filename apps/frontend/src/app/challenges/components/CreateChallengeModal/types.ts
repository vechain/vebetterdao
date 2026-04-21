import { formatEther, parseEther } from "ethers"

import { ChallengeKind, ChallengeType, ChallengeVisibility } from "@/api/challenges/types"
import { CreateChallengeFormData } from "@/api/challenges/useChallengeActions"

export const MAX_SELECTED_APPS = 5
export const QUICK_AMOUNTS = ["50", "100", "250"] as const
export const QUICK_THRESHOLDS = ["1", "5", "10"] as const
export const QUICK_NUM_WINNERS = ["1", "3", "5"] as const

const formatTokenAmount = (value: bigint): string => {
  const formatted = formatEther(value)
  const [whole = formatted, decimal] = formatted.split(".")
  if (!decimal) return whole
  const trimmedDecimal = decimal.replace(/0+$/, "")
  return trimmedDecimal ? `${whole}.${trimmedDecimal}` : whole
}

export const getMinimumBetQuickAmounts = (minBetAmount: bigint): string[] => {
  const baseAmount = minBetAmount > 0n ? minBetAmount : parseEther("100")
  return [baseAmount, baseAmount * 2n, baseAmount * 5n].map(formatTokenAmount)
}

export const STEP_ORDER = [
  "kind",
  "visibility",
  "challengeType",
  "typeExplainer",
  "splitWinConfig",
  "title",
  "amount",
  "startRound",
  "duration",
  "appScope",
  "selectedApps",
  "invitees",
  "review",
] as const

export type ChallengeFlowStep = (typeof STEP_ORDER)[number]
export type AppScope = "all" | "selected"

/**
 * Default new-form values: matrix dictates Bet => Private + MaxActions, so initial values for kind=Stake start there.
 */
export const initialForm = (kind: number, currentRound: number): CreateChallengeFormData => ({
  kind,
  visibility: kind === ChallengeKind.Stake ? ChallengeVisibility.Private : ChallengeVisibility.Public,
  challengeType: ChallengeType.MaxActions,
  stakeAmount: "",
  startRound: currentRound + 1,
  endRound: currentRound + 1,
  threshold: "0",
  numWinners: "0",
  appIds: [],
  invitees: [],
  title: "",
  description: "",
  imageURI: "",
  metadataURI: "",
})

export const parseAmount = (value: string) => {
  if (!value) return 0n
  try {
    return parseEther(value)
  } catch {
    return 0n
  }
}

export const normalizeInteger = (value: string) => {
  if (value === "") return "0"
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return "0"
  return String(Math.max(0, Math.trunc(parsed)))
}

export const getCompactListLabel = (items: string[]) => {
  if (items.length === 0) return ""
  if (items.length <= 2) return items.join(", ")
  return `${items.slice(0, 2).join(", ")}, +${items.length - 2}`
}

export const primaryVariant = "primary" as never
export const tertiaryVariant = "tertiary" as never
export const getChoiceVariant = (active: boolean) => (active ? primaryVariant : tertiaryVariant)

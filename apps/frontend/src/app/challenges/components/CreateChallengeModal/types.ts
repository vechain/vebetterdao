import { parseEther } from "ethers"

import { ChallengeVisibility, ThresholdMode } from "@/api/challenges/types"
import { CreateChallengeFormData } from "@/api/challenges/useChallengeActions"

export const MAX_SELECTED_APPS = 5
export const QUICK_AMOUNTS = ["50", "100", "250"] as const
export const QUICK_THRESHOLDS = ["1", "5", "10"] as const

export const STEP_ORDER = [
  "kind",
  "amount",
  "startRound",
  "duration",
  "winner",
  "threshold",
  "appScope",
  "selectedApps",
  "visibility",
  "invitees",
  "review",
] as const

export type ChallengeFlowStep = (typeof STEP_ORDER)[number]
export type AppScope = "all" | "selected"

export const initialForm = (kind: number, currentRound: number): CreateChallengeFormData => ({
  kind,
  visibility: ChallengeVisibility.Public,
  thresholdMode: ThresholdMode.None,
  stakeAmount: "",
  startRound: currentRound + 1,
  endRound: currentRound + 1,
  threshold: "0",
  appIds: [],
  invitees: [],
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

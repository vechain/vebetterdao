import { AddressUtils } from "@/utils"
import { MAX_DAPP_GRANT_AMOUNT, MAX_TOOLING_GRANT_AMOUNT } from "@/constants"
import AppUtils from "@/utils/AppUtils"
import { GrantFormData } from "@/hooks/proposals/grants/types"
import { t } from "i18next"
import dayjs from "dayjs"

export const patternUrlCheck = {
  value: /^https?:\/\/.+/,
  message: t("Please enter a valid URL starting with http:// or https://"),
}

export const validateUrl = (value: string, fieldName: string) => {
  try {
    new URL(value)
    return true
  } catch {
    return t("Invalid {{fieldName}}", { fieldName })
  }
}

export const validateEmail = (value: string, fieldName: string) => {
  const emailRegex = new RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)
  return emailRegex.test(value) || t("Invalid {{fieldName}}", { fieldName })
}

export const validateAppId = (value: string, fieldName: string) => {
  return AppUtils.isValid(value) || t("Invalid {{fieldName}}", { fieldName })
}

export const genericValidation = (value: string, fieldName: string) => {
  return (value && AddressUtils.isValid(value)) || t("Invalid {{fieldName}}", { fieldName })
}

export const validateMilestoneAmount = (value: number, grantType: string) => {
  if (!value) return true

  if (grantType === "dapp") {
    return value > MAX_DAPP_GRANT_AMOUNT
      ? t("App grant amount must be less than or equal to {{value}} USD", {
          value: MAX_DAPP_GRANT_AMOUNT,
        })
      : true
  } else if (grantType === "tooling") {
    return value > MAX_TOOLING_GRANT_AMOUNT
      ? t("Tooling grant amount must be less than or equal to {{value}} USD", {
          value: MAX_TOOLING_GRANT_AMOUNT,
        })
      : true
  }

  return true
}

export const validateWalletAddress = (value: string, fieldName: string) => {
  return (value && AddressUtils.isValid(value)) || t("Invalid {{fieldName}}", { fieldName })
}

// ============================================================================
// Milestone Validation Functions
// ============================================================================

interface ValidationOptions {
  grantType: string
  milestones: GrantFormData["milestones"]
  currentIndex: number
  currentValue: number
}

const formatDuration = (duration: number | string): string => {
  // duration is already a Unix timestamp in seconds
  return dayjs.unix(Number(duration)).format("MM/DD/YYYY")
}

const getMaxGrantAmount = (grantType: string): number => {
  return grantType === "dapp" ? MAX_DAPP_GRANT_AMOUNT : MAX_TOOLING_GRANT_AMOUNT
}

export const validateMilestoneAmountTotal = ({
  grantType,
  milestones,
  currentIndex,
  currentValue,
}: ValidationOptions): string | boolean => {
  const total = milestones.reduce((acc, milestone, idx) => {
    // Use the current value being validated if it's for this milestone
    const amount = idx === currentIndex ? currentValue : milestone.fundingAmountUsd
    return acc + (Number(amount) || 0)
  }, 0)

  const maxAmount = getMaxGrantAmount(grantType)
  return (
    total <= maxAmount ||
    `Total amount across all milestones exceeds maximum allowed: $${maxAmount.toLocaleString()} USD`
  )
}

export const validateMilestoneStartDate = (
  value: number,
  now: number,
  milestones: GrantFormData["milestones"],
  currentIndex: number,
): string | boolean => {
  // Allow empty values during form filling - validation will happen at submission
  if (!value || value === 0) return "Please enter the start date for this milestone"

  // First milestone must start from now or later
  if (currentIndex === 0) {
    return value >= now || "Start date cannot be in the past"
  }

  // Subsequent milestones must start after the previous milestone ends
  const previousMilestone = milestones[currentIndex - 1]
  if (previousMilestone && previousMilestone.durationTo) {
    const previousEndDate = previousMilestone.durationTo

    // Compare dates at start of day to avoid time-of-day issues
    const currentStartOfDay = dayjs.unix(value).startOf("day").unix()
    const previousEndStartOfDay = dayjs.unix(previousEndDate).startOf("day").unix()

    // Milestone can start on the day after the previous milestone ends
    if (currentStartOfDay <= previousEndStartOfDay) {
      return `Milestone must start after the previous milestone ends (${formatDuration(previousEndDate)})`
    }
  }

  // Check 12-month limit from first milestone start
  const firstMilestoneStart = milestones[0]?.durationFrom
  if (firstMilestoneStart) {
    const twelveMonthsFromStart = dayjs.unix(firstMilestoneStart).add(12, "months").unix()
    if (value > twelveMonthsFromStart) {
      return `All milestones must be completed within 12 months of the first milestone start date (${formatDuration(firstMilestoneStart)})`
    }
  }

  return true
}

export const validateMilestoneEndDate = (
  value: number,
  startDate: number,
  milestones: GrantFormData["milestones"],
): string | boolean => {
  // If no value provided, return true to allow it during form interaction
  // Required validation will be handled at form submission
  if (!value || value === 0) return "Please enter the end date for this milestone"

  // Only validate against start date if start date is set and valid
  if (startDate && startDate > 0) {
    // Compare dates at start of day to avoid time-of-day issues
    const endStartOfDay = dayjs.unix(value).startOf("day").unix()
    const startStartOfDay = dayjs.unix(startDate).startOf("day").unix()

    if (endStartOfDay <= startStartOfDay) {
      return "End date must be after start date"
    }
  }

  // Check 12-month limit from first milestone start
  const firstMilestoneStart = milestones[0]?.durationFrom
  if (firstMilestoneStart) {
    const twelveMonthsFromStart = dayjs.unix(firstMilestoneStart).add(12, "months").unix()
    if (value > twelveMonthsFromStart) {
      return `All milestones must be completed within 12 months of the first milestone start date (${formatDuration(firstMilestoneStart)})`
    }
  }

  return true
}

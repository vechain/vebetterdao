import { AddressUtils } from "@/utils"
import { MAX_DAPP_GRANT_AMOUNT, MAX_TOOLING_GRANT_AMOUNT } from "@/constants"
import AppUtils from "@/utils/AppUtils"
import { t } from "i18next"

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
  return value && AddressUtils.isValid(value) ? t("Invalid {{fieldName}}", { fieldName }) : true
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

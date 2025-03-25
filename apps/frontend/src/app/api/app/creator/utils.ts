import { SubmitCreatorFormData } from "@/components/SubmitCreatorForm"
import FreshdeskClient, { FreshdeskTicket } from "@/utils/FreshDeskClient"
import { Submission } from "./submission/route"

// Type guard to check if an object is a complete SubmitCreatorFormData
function isCompleteSubmitCreatorFormData(data: Partial<SubmitCreatorFormData>): data is SubmitCreatorFormData {
  const requiredFields: (keyof SubmitCreatorFormData)[] = [
    "appName",
    "appDescription",
    "adminWalletAddress",
    "adminEmail",
    "githubUsername",
    "twitterUsername",
    "distributionStrategy",
    "testnetProjectUrl",
    "testnetAppId",
    "securityActionVerification",
  ]

  return requiredFields.every(field => field in data && data[field] !== undefined && data[field] !== null)
}

// Function to check missing fields
export const checkMissingFields = (data: Partial<SubmitCreatorFormData>): string[] | null => {
  if (isCompleteSubmitCreatorFormData(data)) {
    return null
  }

  const missingFields = Object.keys(data).filter(key => !data[key as keyof SubmitCreatorFormData])

  return missingFields.length > 0 ? missingFields : null
}
export const formatSubmission = (result: FreshdeskTicket, freshdeskClient: FreshdeskClient): Submission => {
  return {
    id: result?.id,
    status: freshdeskClient.getHumanizedTicketStatus(result.status),
    adminWalletAddress: result?.custom_fields?.cf_admin_wallet_address?.toLowerCase(),
    distributionStrategy: result?.custom_fields?.cf_distribution_startegy ?? "", //Always return a string even if it's undefined
    createdAt: result?.created_at,
  }
}

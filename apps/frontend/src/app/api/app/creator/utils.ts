import { SubmitCreatorFormData } from "@/components/SubmitCreatorForm"

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

export const checkMissingFields = (data: Partial<SubmitCreatorFormData>): string[] | null => {
  const missingFields = requiredFields.filter(field => !data[field])

  return missingFields.length > 0 ? missingFields : null
}

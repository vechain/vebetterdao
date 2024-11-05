import { SubmitCreatorFormData } from "@/components/SubmitCreatorForm"

const requiredFields: (keyof SubmitCreatorFormData)[] = [
  "appName",
  "appDescription",
  "adminWalletAddress",
  "adminEmail",
  "githubUsername",
  // "twitterUsername",
]

export const isOriginAllowed = (requestOrigin: string, appHost: string): boolean => {
  // Check if requestOrigin is valid
  if (!requestOrigin) return false

  const requestOriginURL = new URL(requestOrigin)

  // Construct the allowed origin using the origin's protocol
  const allowedOrigin = `${requestOriginURL.protocol}//${appHost}`

  return allowedOrigin === requestOriginURL.origin || allowedOrigin === requestOriginURL.href
}

export const checkMissingFields = (data: Partial<SubmitCreatorFormData>): string[] | null => {
  const missingFields = requiredFields.filter(field => !data[field])

  return missingFields.length > 0 ? missingFields : null
}

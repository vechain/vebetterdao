import FreshdeskClient, { FreshdeskTicket } from "@/utils/FreshDeskClient"

import { SubmitCreatorFormData } from "../../../../components/SubmitCreatorForm/SubmitCreatorForm"

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
    appName: result?.custom_fields?.cf_app_name ?? "",
    projectUrl: result?.custom_fields?.cf_app_url_optional ?? "",
    adminWalletAddress: result?.custom_fields?.cf_admin_wallet_address?.toLowerCase(),
    distributionStrategy: result?.custom_fields?.cf_distribution_startegy ?? "", //Always return a string even if it's undefined
    createdAt: result?.created_at,
  }
}
export const humanizeSummary = ({
  appName,
  appDescription,
  adminWalletAddress,
  adminName,
  adminEmail,
  projectUrl,
  githubUsername,
  twitterUsername,
  distributionStrategy,
  testnetProjectUrl,
  testnetAppId,
  securityApiSecurityMeasures,
  securityActionVerification,
  securityDeviceFingerprint,
  securitySecureKeyManagement,
  securityAntiFarming,
}: SubmitCreatorFormData): string => {
  return `
<h2>📝 Application Details</h2>
<strong>Name:</strong> ${appName || "N/A"}<br>
<strong>Description:</strong> ${appDescription || "N/A"}<br><br>

<h2>👤 Creator Information</h2>
<strong>Name:</strong> ${adminName || "N/A"}<br>
<strong>Email:</strong> ${adminEmail || "N/A"}<br>
<strong>Wallet Address:</strong> ${adminWalletAddress ? adminWalletAddress.toLowerCase() : "N/A"}<br>
${githubUsername ? `<strong>GitHub:</strong> <a href="https://github.com/${githubUsername}" target="_blank">@${githubUsername}</a><br>` : ""}
${twitterUsername ? `<strong>Twitter:</strong> <a href="https://twitter.com/${twitterUsername}" target="_blank">@${twitterUsername}</a><br>` : ""}<br>

<h2>🌐 Project URLs</h2>
${projectUrl ? `<strong>Mainnet Project URL:</strong> <a href="${projectUrl}" target="_blank">${projectUrl}</a><br>` : "N/A"}
${testnetProjectUrl ? `<strong>Testnet Project URL:</strong> <a href="${testnetProjectUrl}" target="_blank">${testnetProjectUrl}</a><br>` : "N/A"}
${testnetAppId ? `<strong>Testnet App ID:</strong> <a href="https://testnet.governance.vebetterdao.org/apps/${testnetAppId}" target="_blank">${testnetAppId}</a>` : "N/A"}<br>

<h2>📦 Distribution Strategy</h2>
<p>${distributionStrategy || "No strategy provided."}</p>

<h2>🔒 Security Implementation</h2>
<ul>
  <li><strong>API Security Measures:</strong> ${securityApiSecurityMeasures ? "✅ Implemented" : "❌ Not Implemented"}</li>
  <li><strong>Action Verification:</strong> ${securityActionVerification ? "✅ Implemented" : "❌ Not Implemented"}</li>
  <li><strong>Device Fingerprinting:</strong> ${securityDeviceFingerprint ? "✅ Implemented" : "❌ Not Implemented"}</li>
  <li><strong>Secure Key Management:</strong> ${securitySecureKeyManagement ? "✅ Implemented" : "❌ Not Implemented"}</li>
  <li><strong>Anti-Farming Measures:</strong> ${securityAntiFarming ? "✅ Implemented" : "❌ Not Implemented"}</li>
</ul>
  `.trim()
}

import * as AddressUtils from "@repo/utils/AddressUtils"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import FreshdeskClient, { FreshdeskTicketBody } from "@/utils/FreshDeskClient"

import { SubmitCreatorFormData } from "../../../../components/SubmitCreatorForm/SubmitCreatorForm"
import { authOptions } from "../../auth/[...nextauth]/options"

import { checkMissingFields, humanizeSummary } from "./utils"

// Handle POST request
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 })
  }
  if (!process.env.FRESHDESK_API_TOKEN || !process.env.FRESHDESK_DOMAIN || !process.env.FRESHDESK_GROUP_ID) {
    console.warn("API: Missing environment variables for Freshdesk")
    return NextResponse.json({ error: "Missing environment variables" }, { status: 500 })
  }
  try {
    const data: Partial<SubmitCreatorFormData> = await request.json()
    // Validate required fields
    if (checkMissingFields(data)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!AddressUtils.isValid(data?.adminWalletAddress ?? "")) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
    }
    if (!data?.securityActionVerification) {
      return NextResponse.json({ error: "Security action verification is required" }, { status: 400 })
    }
    const {
      appName,
      adminEmail,
      adminName,
      adminWalletAddress,
      projectUrl = "",
      githubUsername,
      twitterUsername,
      testnetProjectUrl,
      testnetAppId,
      distributionStrategy,
      securityApiSecurityMeasures,
      securityActionVerification,
      securityDeviceFingerprint,
      securitySecureKeyManagement,
      securityAntiFarming,
    } = data as SubmitCreatorFormData

    const ticketBody: FreshdeskTicketBody = {
      description: humanizeSummary(data as SubmitCreatorFormData),
      subject: `[${appName}] Access Request`,
      group_id: Number(process.env.FRESHDESK_GROUP_ID),
      email: adminEmail,
      custom_fields: {
        cf_app_name: appName,
        cf_app_creator_email: adminEmail,
        cf_app_creator_name_optional: adminName,
        cf_app_url_optional: projectUrl,
        cf_github_username: githubUsername,
        cf_admin_wallet_address: adminWalletAddress.toLowerCase(),
        cf_x_username: twitterUsername,
        cf_testnet_project_url: testnetProjectUrl,
        cf_testnet_app_id: testnetAppId.toLowerCase(),
        cf_distribution_startegy: distributionStrategy,
        cf_security_api_security_measures: securityApiSecurityMeasures,
        cf_security_action_verification: securityActionVerification,
        cf_security_device_fingerprint: securityDeviceFingerprint,
        cf_security_secure_key_management: securitySecureKeyManagement,
        cf_security_anti_farming: securityAntiFarming,
      },
    }

    const freshdeskClient = new FreshdeskClient(process.env.FRESHDESK_API_TOKEN, process.env.FRESHDESK_DOMAIN)
    const response = await freshdeskClient.createTicket(ticketBody)
    return NextResponse.json({ message: "Submission successfully sent !", ticket: response })
  } catch (error: Error | any) {
    const errorMessage = error.response?.data || error.message
    return NextResponse.json({ message: "Failed to send submission", error: errorMessage }, { status: 500 })
  }
}

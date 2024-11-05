import { NextRequest, NextResponse } from "next/server"
import FreshdeskClient, { FreshdeskTicketBody } from "@/utils/FreshDeskClient"
import { checkMissingFields, validateRequestOrigin, validateRequestSession } from "./utils"
import { SubmitCreatorFormData } from "@/components/SubmitCreatorForm"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"

export async function GET(request: NextRequest) {
  if (!process.env.FRESHDESK_API_TOKEN || !process.env.FRESHDESK_DOMAIN || !process.env.FRESHDESK_GROUP_ID) {
    throw new Error("Missing environment variables for Freshdesk")
  }
  // Validate request origin and session
  // IF the request origin is not allowed, return a 403 response
  validateRequestOrigin(request)

  const walletAddress = request.nextUrl.searchParams.get("walletAddress")

  if (!walletAddress) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const freshdeskClient = new FreshdeskClient(process.env.FRESHDESK_API_TOKEN, process.env.FRESHDESK_DOMAIN)
  try {
    const response = await freshdeskClient.getTicketByAdminWalletAddress(walletAddress)
    if (!response?.results?.length) {
      return NextResponse.json({ error: "No submission found" }, { status: 404 })
    }
    const formattedResponse = response.results.map((result: any) => {
      return {
        id: result.id,
        status: result.status,
        appName: result.custom_fields.cf_app_name,
        adminWalletAddress: result.custom_fields.cf_admin_wallet_address,
        createdAt: result.created_at,
      }
    })
    return NextResponse.json({ submissions: formattedResponse })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 })
  }
}
// Handle POST request
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!process.env.FRESHDESK_API_TOKEN || !process.env.FRESHDESK_DOMAIN || !process.env.FRESHDESK_GROUP_ID) {
    throw new Error("Missing environment variables for Freshdesk")
  }

  // Validate request origin and session
  // IF the request origin is not allowed, return a 403 response
  // IF the session is not valid, return a 403 response
  validateRequestOrigin(request)
  validateRequestSession(session)

  try {
    const data: Partial<SubmitCreatorFormData> = await request.json()

    // Validate required fields
    if (checkMissingFields(data)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const {
      appName,
      appDescription,
      adminWalletAddress,
      adminName,
      adminEmail,
      projectUrl = "",
      githubUsername,
      twitterUsername,
    } = data as SubmitCreatorFormData

    const ticketBody: FreshdeskTicketBody = {
      description: appDescription,
      subject: `[${appName}] Access Request`,
      group_id: Number(process.env.FRESHDESK_GROUP_ID),
      email: adminEmail,
      custom_fields: {
        cf_app_name: appName,
        cf_app_description: appDescription,
        cf_app_creator_email: adminEmail,
        cf_app_creator_name_optional: adminName,
        cf_app_url_optional: projectUrl,
        cf_github_username: githubUsername,
        cf_admin_wallet_address: adminWalletAddress,
        cf_x_username: twitterUsername,
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

import { compareAddresses } from "@/utils/AddressUtils/AddressUtils"
import FreshdeskClient, { FreshdeskTicket } from "@/utils/FreshDeskClient"
import { AddressUtils } from "@repo/utils"
import { NextRequest, NextResponse } from "next/server"

export interface Submission {
  id: number
  status: string
  adminWalletAddress: string
  createdAt: string
}

export interface SubmissionsResponse {
  submissions: Submission[]
}

export async function GET(request: NextRequest): Promise<NextResponse<SubmissionsResponse | { error: string }>> {
  if (!process.env.FRESHDESK_API_TOKEN || !process.env.FRESHDESK_DOMAIN || !process.env.FRESHDESK_GROUP_ID) {
    throw new Error("Missing environment variables for Freshdesk")
  }

  const walletAddress = request.nextUrl.searchParams.get("walletAddress")
  if (!walletAddress || !AddressUtils.isValid(walletAddress)) {
    return NextResponse.json({ error: "Invalid parameter" }, { status: 400 })
  }

  const freshdeskClient = new FreshdeskClient(process.env.FRESHDESK_API_TOKEN, process.env.FRESHDESK_DOMAIN)
  try {
    const response = await freshdeskClient.getTicketByAdminWalletAddress(walletAddress.toLowerCase())
    if (!response?.results) {
      return NextResponse.json({ submissions: [] })
    }
    const formattedResponse = response.results
      .filter(
        (result: FreshdeskTicket) =>
          result?.custom_fields?.cf_admin_wallet_address &&
          compareAddresses(result.custom_fields.cf_admin_wallet_address, walletAddress),
      )
      .map((result: FreshdeskTicket) => {
        const status = freshdeskClient.getHumanizedTicketStatus(result.status)
        return {
          id: result.id,
          status,
          adminWalletAddress: result.custom_fields.cf_admin_wallet_address?.toLowerCase(),
          createdAt: result.created_at,
        }
      })

    return NextResponse.json({ submissions: formattedResponse.length > 0 ? formattedResponse : [] })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 })
  }
}

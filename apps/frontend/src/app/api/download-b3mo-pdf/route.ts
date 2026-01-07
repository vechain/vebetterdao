import { NextRequest, NextResponse } from "next/server"

const b3moDomain = process.env.B3MO_DOMAIN || "https://d1px0i9vqvp8ud.cloudfront.net"
const b3moApiKey = process.env.PROPOSAL_SUMMARY_B3MO_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const proposalId = searchParams.get("proposalId")
  const status = searchParams.get("status")

  if (!proposalId || !status) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  if (!b3moApiKey) {
    console.error("PROPOSAL_SUMMARY_B3MO_API_KEY is not configured")
    return NextResponse.json({ error: "Service configuration error" }, { status: 500 })
  }

  const pdfUrl = `${b3moDomain}/proposal_summaries/${proposalId}/${status}/outputs/07_phase1_support_summary.pdf`

  try {
    const response = await fetch(pdfUrl, {
      headers: {
        "X-API-KEY": b3moApiKey,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: response.status })
    }

    const arrayBuffer = await response.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="proposal-${proposalId}-analysis.pdf"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error fetching PDF:", error)
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Validate request origin
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const hostUrl = request.headers.get("host")

  // Only allow requests from same origin or trusted origins
  const isValidOrigin = !origin || origin.includes(hostUrl || "")
  const isValidReferer = !referer || referer.includes(hostUrl || "")

  if (!isValidOrigin || !isValidReferer) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  try {
    // Parse the request body to get the wallet address
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // In a real implementation, you would call your verification service here
    // For now, we'll simulate the same behavior as in the component

    // Add artificial delay to simulate network request (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate 70% success rate for demonstration purposes
    const isSuccessful = Math.random() > 0.3

    if (isSuccessful) {
      return NextResponse.json({
        status: "success",
        message: "The appeal process is complete. You have just been unbanned.",
      })
    } else {
      return NextResponse.json(
        {
          status: "error",
          message: "Your KYC verification was unsuccessful. Please try again or contact support.",
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("Verification error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}

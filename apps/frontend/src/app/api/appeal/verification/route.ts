import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the wallet address
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const isTestnetEnvironment = process.env.NEXT_PUBLIC_APP_ENV === "testnet-staging"

    const apiEndpoint = isTestnetEnvironment
      ? process.env.TESTNET_RESET_USER_SIGNAL_COUNT_DOMAIN
      : process.env.RESET_USER_SIGNAL_COUNT_DOMAIN

    const apiAuthKey = isTestnetEnvironment
      ? process.env.TESTNET_RESET_USER_SIGNAL_COUNT_API_KEY
      : process.env.RESET_USER_SIGNAL_COUNT_API_KEY

    // Validate environment configuration
    if (!apiEndpoint || !apiAuthKey) {
      console.warn("API: Missing environment variables for RESET_USER_SIGNAL_COUNT API")
      return NextResponse.json({ error: "Missing environment variables" }, { status: 500 })
    }

    // Make API request to reset user signal count
    const apiResponse = await fetch(apiEndpoint, {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
      headers: {
        "x-api-key": apiAuthKey,
      },
    })

    if (!apiResponse.ok) {
      console.error("Failed to reset user signal count", apiResponse)
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to reset user signal count",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "success",
      message: "Successfully reseting the user signal count",
    })
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

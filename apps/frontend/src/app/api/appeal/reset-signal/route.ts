import { NextRequest, NextResponse } from "next/server"

interface ApiErrorDetails {
  message: string
}
interface ApiError {
  code: string
  message: string
  details?: ApiErrorDetails
}
interface ApiErrorResponse {
  error: ApiError
}
type JsonApiResponse = {
  statusCode: number
  body: string
}
// Have tested this function on POSTMAN and it takes around 20 seconds to run
// Setting maxDuration to 30 seconds to be safe
export const maxDuration = 30
export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the wallet address
    const { walletAddress } = await request.json()
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }
    const apiEndpoint = process.env.RESET_USER_SIGNAL_COUNT_DOMAIN
    const apiAuthKey = process.env.RESET_USER_SIGNAL_COUNT_API_KEY
    // Validate environment configuration
    if (!apiEndpoint || !apiAuthKey) {
      console.warn("API: Missing environment variables for RESET_USER_SIGNAL_COUNT API")
      return NextResponse.json({ status: "error", message: "Missing environment variables" }, { status: 500 })
    }
    // Make API request to reset user signal count to our Lambda function
    const apiResponse = await fetch(apiEndpoint, {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
      headers: {
        "x-api-key": apiAuthKey,
      },
    })

    const resJson = (await apiResponse.json()) as JsonApiResponse

    if (resJson.statusCode !== 200) {
      const errorResponse = JSON.parse(resJson.body) as ApiErrorResponse
      const errorDetails = errorResponse.error
      const errorMessage = errorDetails?.details?.message || "Failed to reset user signal count"

      return NextResponse.json(
        {
          status: "error",
          message: errorMessage,
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

import { NextRequest, NextResponse } from "next/server"

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
// Helper function to set headers
function setHeaders(response: NextResponse, headers: Record<string, string>) {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
}
export async function middleware(request: NextRequest) {
  const referer = request.headers.get("referer")
  const appUrl = new URL(request.url)
  const refererURL = referer ? new URL(request.headers.get("referer") ?? "") : null
  const isAllowedOrigin = refererURL && refererURL.origin === appUrl.origin
  console.log("isAllowedOrigin", isAllowedOrigin)
  console.log("refererURL", refererURL)
  console.log("appUrl", appUrl)
  console.log("referer", referer)
  console.log("request.url", request.url)
  console.log("request.method", request.method)
  console.log("request.body", request.body)
  console.log("request.nextUrl", request.nextUrl)
  if (!isAllowedOrigin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 })
  }
  // Handle preflight (OPTIONS) requests
  if (request.method === "OPTIONS") {
    const preflightHeaders = {
      ...(isAllowedOrigin ? { "Access-Control-Allow-Origin": appUrl.origin } : {}),
      ...corsOptions,
    }
    return NextResponse.json({}, { headers: preflightHeaders })
  }
  // Handle actual requests
  const response = NextResponse.next()
  // Set CORS headers for allowed origins
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", appUrl.origin)
  }
  setHeaders(response, { ...corsOptions })
  return response
}
//Enabling middleware only for the /api/app/:path* route
export const config = {
  matcher: "/api/app/:path*",
}

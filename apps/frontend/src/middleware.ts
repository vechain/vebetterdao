import { NextRequest, NextResponse } from "next/server"

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

function firstForwardedValue(value: string | null) {
  // Proxies can send "a, b" - use the client-facing value
  return value?.split(",")[0]?.trim() ?? null
}

function safeOrigin(value: string | null) {
  if (!value || value === "null") return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function getAppOrigin(request: NextRequest) {
  const proto =
    firstForwardedValue(request.headers.get("x-forwarded-proto")) ?? request.nextUrl.protocol.replace(":", "")
  const host = firstForwardedValue(request.headers.get("x-forwarded-host")) ?? request.headers.get("host")
  return host ? `${proto}://${host}` : null
}
// Helper function to set headers
function setHeaders(response: NextResponse, headers: Record<string, string>) {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
}
export async function middleware(request: NextRequest) {
  const appOrigin = getAppOrigin(request)

  console.log("appOrigin", appOrigin)

  // Browser hardening: when present, this prevents cross-site calls in real browsers.
  // (Non-browser clients can spoof headers; session auth is still the real gate.)
  const secFetchSite = request.headers.get("sec-fetch-site")
  console.log("secFetchSite", secFetchSite)
  if (secFetchSite && secFetchSite !== "same-origin") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 })
  }

  // Prefer Origin (CORS), fall back to Referer for same-origin GETs that omit Origin.
  const requestOrigin = safeOrigin(request.headers.get("origin")) ?? safeOrigin(request.headers.get("referer"))
  console.log("requestOrigin", requestOrigin)
  const isAllowedOrigin = Boolean(appOrigin && requestOrigin && requestOrigin === appOrigin)
  console.log("appOrigin", appOrigin)
  console.log("requestOrigin", requestOrigin)
  console.log("isAllowedOrigin", isAllowedOrigin)
  console.log(
    "appOrigin && requestOrigin && requestOrigin === appOrigin",
    appOrigin && requestOrigin && requestOrigin === appOrigin,
  )
  console.log("isAllowedOrigin", isAllowedOrigin)

  const corsHeaders: Record<string, string> = {
    ...corsOptions,
    ...(isAllowedOrigin && requestOrigin ? { "Access-Control-Allow-Origin": requestOrigin } : {}),
    Vary: "Origin",
  }
  // Handle preflight (OPTIONS) requests
  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin) return NextResponse.json({ error: "Access Denied" }, { status: 403 })
    return NextResponse.json({}, { headers: corsHeaders })
  }
  if (!isAllowedOrigin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 })
  }
  // Handle actual requests
  const response = NextResponse.next()
  setHeaders(response, corsHeaders)
  return response
}
//Enabling middleware only for the /api/app/:path* route
export const config = {
  matcher: "/api/app/:path*",
}

import { NextRequest, NextResponse } from "next/server"

// Realistic browser UA. Many sites (Reddit in particular) return a blocked or
// login-wall HTML with no OG meta when the UA looks like a bot/crawler, so we
// impersonate a modern desktop Chrome.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

// New Reddit (www.reddit.com) is a JS-heavy SPA and frequently serves an
// interstitial without usable OG tags. old.reddit.com renders the same content
// server-side with a clean <head> containing OG meta.
const normalizeUrl = (raw: string): string => {
  try {
    const u = new URL(raw)
    if (u.hostname === "www.reddit.com" || u.hostname === "reddit.com") {
      u.hostname = "old.reddit.com"
      return u.toString()
    }
    return raw
  } catch {
    return raw
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 })

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    const res = await fetch(normalizeUrl(url), {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()

    const og = {
      title: extract(html, 'property="og:title"') ?? extract(html, 'name="title"') ?? extractTag(html, "title"),
      description: extract(html, 'property="og:description"') ?? extract(html, 'name="description"'),
      image: extract(html, 'property="og:image"'),
      siteName: extract(html, 'property="og:site_name"'),
    }

    return NextResponse.json(og, {
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 502 })
  }
}

function extract(html: string, attr: string): string | undefined {
  const regex = new RegExp(`<meta[^>]*${attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*content=["']([^"']*)["']`, "i")
  const match = html.match(regex)
  if (match) return match[1]

  const reversed = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*${attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "i",
  )
  const reverseMatch = html.match(reversed)
  return reverseMatch?.[1]
}

function extractTag(html: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i")
  return html.match(regex)?.[1]?.trim()
}

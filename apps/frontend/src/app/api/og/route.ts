import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 })

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "bot" },
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

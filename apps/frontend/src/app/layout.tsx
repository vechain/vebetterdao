export const fetchCache = "force-no-store"

import { getConfig, PUBLIC_ENV_KEYS } from "@repo/config"
import { Metadata, Viewport } from "next"

import { APPLICATION_NAME, IMAGE_DIMENSION, pagesMetadata } from "@/metadata/pages"

import { ClientWrapper } from "./client-wrapper"

// Escape `<` to its JS unicode form so no env value can produce a literal
// `</script>` that would break out of the inline script tag below.
const runtimeEnvJson = JSON.stringify(Object.fromEntries(PUBLIC_ENV_KEYS.map(k => [k, process.env[k] ?? ""]))).replace(
  /</g,
  "\\u003c",
)

// Get metadata of the platform
const basePath = getConfig()?.basePath
const platformMetadata = pagesMetadata?.platform
const title = platformMetadata?.title
const metadataDesc = platformMetadata?.description
const imageUrl = `${basePath}${platformMetadata?.image}`
const imageExtension = platformMetadata?.imageExtension
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  interactiveWidget: "overlays-content",
  maximumScale: 1,
}
// Export proper metadata for the platform with template support
export const metadata: Metadata = {
  title: title || "VeBetter Governance | Shape the Ecosystem and Earn B3TR Rewards",
  description: metadataDesc,
  applicationName: APPLICATION_NAME,
  keywords: ["VeBetter", "B3TR", "governance", "sustainability", "VeChain", "Web3", "DAO"],
  appleWebApp: {
    title,
  },
  openGraph: {
    title,
    type: "website",
    url: basePath,
    description: metadataDesc,
    siteName: APPLICATION_NAME,
    images: [
      {
        url: imageUrl,
        type: imageExtension,
        width: IMAGE_DIMENSION.width,
        height: IMAGE_DIMENSION.height,
        alt: APPLICATION_NAME,
      },
    ],
  },
  twitter: {
    title,
    description: metadataDesc,
    images: [imageUrl],
    card: "summary_large_image",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      style={{
        scrollBehavior: "smooth",
      }}>
      <head>
        <script id="__runtime_env__" dangerouslySetInnerHTML={{ __html: `window.__ENV__=${runtimeEnvJson};` }} />
        <link rel="dns-prefetch" href="https://indexer.mainnet.vechain.org" />
        <link rel="dns-prefetch" href="https://euc-widget.freshworks.com" />
        <link rel="preconnect" href="https://indexer.mainnet.vechain.org" crossOrigin="anonymous" />
      </head>
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  )
}

export const fetchCache = "force-no-store"

import { getConfig } from "@repo/config"
import { Metadata, Viewport } from "next"

import { APPLICATION_NAME, IMAGE_DIMENSION, pagesMetadata } from "@/metadata/pages"

import { ClientWrapper } from "./client-wrapper"

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
  interactiveWidget: "resizes-content",
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
        <link rel="dns-prefetch" href="https://indexer.mainnet.vechain.org" />
        <link rel="dns-prefetch" href="https://euc-widget.freshworks.com" />
        <link rel="dns-prefetch" href="https://datadoghq.eu" />
        <link rel="preconnect" href="https://indexer.mainnet.vechain.org" crossOrigin="anonymous" />
      </head>
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  )
}

import { getConfig } from "@repo/config"
import { APPLICATION_NAME, IMAGE_DIMENSION, pagesMetadata } from "@/metadata/pages"
import { Metadata, Viewport } from "next"
import { ClientWrapper } from "./client-wrapper"

// Get metadata of the platform
const platformMetadata = pagesMetadata?.platform
const title = platformMetadata?.title
const metadataDesc = platformMetadata?.description

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
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
    url: "%VITE_BASE_URL%",
    description: metadataDesc,
    siteName: APPLICATION_NAME,
    images: [
      {
        url: `${getConfig().basePath}/assets/images/social_image.webp`,
        type: "image/png",
        width: IMAGE_DIMENSION.width,
        height: IMAGE_DIMENSION.height,
        alt: APPLICATION_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: metadataDesc,
    images: [`${getConfig().basePath}/assets/images/social_image.webp`],
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
      <head />
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  )
}

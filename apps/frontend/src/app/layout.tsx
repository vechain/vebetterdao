import { getConfig } from "@repo/config"
import { pagesMetadata } from "@/metadata/pages"
import { Metadata, Viewport } from "next"
import { ClientWrapper } from "./client-wrapper"

// Get metadata of the platform
const platformAppName = "VeBetter"
const platformMetadata = pagesMetadata?.platform
const platformMetadataDescription = platformMetadata?.description

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
}

// Export proper metadata for the platform with template support
export const metadata: Metadata = {
  title: {
    template: "%s | VeBetter",
    default: platformMetadata?.title || "VeBetter Governance | Shape the Ecosystem and Earn B3TR Rewards",
  },
  description: platformMetadataDescription,
  applicationName: platformAppName,
  keywords: ["VeBetter", "B3TR", "governance", "sustainability", "VeChain", "Web3", "DAO"],
  appleWebApp: {
    title: platformAppName,
  },
  openGraph: {
    title: platformAppName,
    type: "website",
    url: "%VITE_BASE_URL%",
    description: platformMetadataDescription,
    siteName: platformAppName,
    images: [
      {
        url: `${getConfig().basePath}/assets/images/social_image.webp`,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: platformAppName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: platformAppName,
    description: platformMetadataDescription,
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

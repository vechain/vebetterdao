// app/layout.tsx

import { getConfig } from "@repo/config"
import nextDynamic from "next/dynamic"

// Enforce static generation for all the pages of the app
// We can change this behavior for specific pages by setting the `dynamic` property to `force-dynamic. Not needed atm as we don't really use SSR
export const dynamic = "force-static"

const RootLayoutContent = nextDynamic(() => import("./RootLayoutContent").then(mod => mod.RootLayoutContent), {
  ssr: false,
})

// Define metadata for your layout
export const metadata = {
  title: "VeBetterDAO",
  description: "Vote for your favourite sustainability Apps in VeBetterDAO’s governance.",
  openGraph: {
    title: "VeBetterDAO",
    type: "website",
    url: getConfig().basePath,
    description: "Vote for your favourite sustainability Apps in VeBetterDAO’s governance.",
    site_name: "VeBetterDAO",
    images: [
      {
        url: `${getConfig().basePath}/images/social_image.png`,
        width: 1200,
        height: 630,
        alt: "VeBetterDAO",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VeBetterDAO",
    description: "Vote for your favourite sustainability Apps in VeBetterDAO’s governance.",
    image: `${getConfig().basePath}/images/social_image.png`,
    imageAlt: "VeBetterDAO",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={{ scrollBehavior: "smooth" }}>
      <head>
        <link rel="icon" href="/images/favicon.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/images/favicon.png" />
        <meta name="msapplication-TileImage" content="/images/favicon.png" />
      </head>
      <body>
        <RootLayoutContent>{children}</RootLayoutContent>
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import dynamic from "next/dynamic"

const ClientApp = dynamic(() => import("./ClientApp").then(mod => mod.ClientApp), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {"Loading..."}
    </div>
  ),
})

export const metadata: Metadata = {
  title: "Relayer Dashboard | VeBetterDAO Auto-Voting",
  description: "Auto-voting and relayer analytics for VeBetterDAO governance.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientApp>{children}</ClientApp>
      </body>
    </html>
  )
}

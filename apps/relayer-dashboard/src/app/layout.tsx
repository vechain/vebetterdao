import type { Metadata } from "next"
import dynamic from "next/dynamic"

const ClientApp = dynamic(() => import("./ClientApp").then(mod => mod.ClientApp), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        background: "#F9F9FA",
      }}>
      <style>{`
        @media (prefers-color-scheme: dark) {
          .loading-container { background: #0F0F0F !important; }
          .loading-dot { background: #525860 !important; }
        }
        @keyframes loading-bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="loading-container" style={{ display: "flex", gap: "8px" }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="loading-dot"
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#AAAFB6",
              animation: `loading-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  ),
})

export const metadata: Metadata = {
  title: "VeBetter Relayers | VeBetterDAO Auto-Voting",
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

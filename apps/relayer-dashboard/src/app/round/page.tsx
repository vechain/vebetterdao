"use client"

import dynamic from "next/dynamic"

const RoundDetailPage = dynamic(() => import("@/app/round/RoundDetailPage"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {"Loading\u2026"}
    </div>
  ),
})

export default function RoundPage() {
  return <RoundDetailPage />
}

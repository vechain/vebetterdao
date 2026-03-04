"use client"

import dynamic from "next/dynamic"

const DashboardContent = dynamic(() => import("./DashboardContent"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {"Loading\u2026"}
    </div>
  ),
})

export default function HomePage() {
  return <DashboardContent />
}

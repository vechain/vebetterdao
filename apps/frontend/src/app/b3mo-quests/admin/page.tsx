"use client"

import dynamic from "next/dynamic"

const AdminDashboardContent = dynamic(
  () => import("./components/AdminDashboardContent").then(mod => mod.AdminDashboardContent),
  { ssr: false },
)

export default function QuestsAdminDashboardPage() {
  return <AdminDashboardContent />
}

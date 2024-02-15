"use client"

import dynamic from "next/dynamic"

const ProposalsPageContent = dynamic(
  () => import("./components/ProposalsPageContent").then(mod => mod.ProposalPageContent),
  { ssr: false },
)
export default function ProposalsPage() {
  return <ProposalsPageContent />
}

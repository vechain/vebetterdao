"use client"
import dynamic from "next/dynamic"

const NewFormProposalLayoutContent = dynamic(
  () => import("./NewFormProposalLayout").then(mod => mod.NewFormProposalLayoutContent),
  {
    ssr: false,
  },
)
type Props = {
  children: React.ReactNode
}
export default function NewFormProposalLayout({ children }: Readonly<Props>) {
  return <NewFormProposalLayoutContent>{children}</NewFormProposalLayoutContent>
}

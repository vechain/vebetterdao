import { getPageMetadata } from "@/utils/metadata"

export const metadata = getPageMetadata("allocations")

export const dynamic = "force-dynamic"

interface AllocationsLayoutProps {
  children: React.ReactNode
}

export default function AllocationsLayout({ children }: AllocationsLayoutProps) {
  return children
}

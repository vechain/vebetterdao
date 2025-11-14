import { getPageMetadata } from "@/utils/metadata"

export const metadata = getPageMetadata("allocations")

interface AllocationsLayoutProps {
  children: React.ReactNode
}

export default function AllocationsLayout({ children }: AllocationsLayoutProps) {
  return children
}

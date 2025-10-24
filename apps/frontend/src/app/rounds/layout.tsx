import { getPageMetadata } from "@/utils/metadata"

export const metadata = getPageMetadata("allocations")
export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return children
}

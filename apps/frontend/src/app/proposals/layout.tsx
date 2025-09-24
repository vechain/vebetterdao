import { getPageMetadata } from "@/utils/metadata"

export const metadata = getPageMetadata("proposals")

export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return children
}

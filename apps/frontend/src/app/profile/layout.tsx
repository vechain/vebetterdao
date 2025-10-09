import { getPageMetadata } from "@/utils/metadata"

export const metadata = getPageMetadata("profile")
export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return children
}

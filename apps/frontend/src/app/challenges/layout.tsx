import { getPageMetadata } from "@/utils/metadata"

export const metadata = getPageMetadata("challenges")
export const dynamic = "force-dynamic"

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children
}

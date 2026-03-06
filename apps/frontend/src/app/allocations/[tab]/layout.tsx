import { StartNewRoundAlert } from "@/app/components/StartNewRoundAlert"

export default async function TabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StartNewRoundAlert />
      {children}
    </>
  )
}

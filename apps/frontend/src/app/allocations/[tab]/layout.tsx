import { StartNewRoundAlert } from "@/app/components/StartNewRoundAlert"

import { AllocationLayoutHeader } from "../components/AllocationLayoutHeader"

export default async function TabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StartNewRoundAlert />
      <AllocationLayoutHeader />

      {children}
    </>
  )
}

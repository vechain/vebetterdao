import { AllocationLayoutHeader } from "../components/AllocationLayoutHeader"

export default async function TabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AllocationLayoutHeader />

      {children}
    </>
  )
}

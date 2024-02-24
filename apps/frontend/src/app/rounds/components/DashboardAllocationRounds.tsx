import { useAllocationsRoundsEvents } from "@/api"
import { AllocationRoundsList } from "@/components"

export const DashboardAllocationRounds = () => {
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()

  if (allocationRoundsEvents && allocationRoundsEvents?.created.length > 0)
    return <AllocationRoundsList maxRoundsToShow={3} headingSize="md" renderInsideCard={true} />

  return null
}

import { useAllocationsRoundsEvents } from "@/api"
import { AllocationRoundsList } from "@/components"
import { useBreakpointValue } from "@chakra-ui/react"

export const DashboardAllocationRounds = () => {
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()

  const renderInsideCard = useBreakpointValue(
    { base: false, md: true },
    {
      fallback: "false",
    },
  )

  if (allocationRoundsEvents && allocationRoundsEvents?.created.length > 0)
    return <AllocationRoundsList maxRoundsToShow={3} headingSize="md" renderInsideCard={renderInsideCard} />

  return null
}

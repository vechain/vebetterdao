import { useAllocationsRoundsEvents } from "@/api"
import { AllocationRoundsList } from "@/components"
import { Box } from "@chakra-ui/react"

export const DashboardAllocationRounds = () => {
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()

  if (allocationRoundsEvents && allocationRoundsEvents?.created.length > 0)
    return (
      <Box>
        <AllocationRoundsList maxRoundsToShow={3} headingSize="md" renderInsideCard={true} />
      </Box>
    )

  return null
}

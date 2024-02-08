import { useCurrentAllocationsRound } from "@/api"
import { Card, CardBody } from "@chakra-ui/react"
import { AllocationRoundDetails } from "./components/AllocationRoundDetails"
import { CreateNewAllocationRound } from "./components/CreateNewAllocationRound"

export const CurrentAllocationBanner = () => {
  const { data: currentRound } = useCurrentAllocationsRound()

  console.log("currentRound", currentRound)

  return (
    <Card w="full">
      <CardBody>
        {currentRound ? <AllocationRoundDetails round={currentRound} /> : <CreateNewAllocationRound />}
      </CardBody>
    </Card>
  )
}

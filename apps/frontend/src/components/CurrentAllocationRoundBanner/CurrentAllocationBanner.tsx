import { useCurrentAllocationsRound } from "@/api"
import { Card, CardBody, Heading } from "@chakra-ui/react"
import error from "next/error"
import { AllocationRoundDetails } from "./components/AllocationRoundDetails"
import { CreateNewAllocationRound } from "./components/CreateNewAllocationRound"

export const CurrentAllocationBanner = () => {
  const { data: currentRoundId } = useCurrentAllocationsRound()

  const roundExists = currentRoundId && currentRoundId !== "0"
  console.log("currentRoundId", currentRoundId)

  return (
    <Card w="full">
      <CardBody>
        {roundExists ? <AllocationRoundDetails roundId={currentRoundId} /> : <CreateNewAllocationRound />}
      </CardBody>
    </Card>
  )
}

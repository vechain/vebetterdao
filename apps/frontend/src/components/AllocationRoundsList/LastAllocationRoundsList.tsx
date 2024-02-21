import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  HStack,
  Heading,
  Icon,
  VStack,
} from "@chakra-ui/react"
import { useAllocationsRoundsEvents } from "@/api"
import { AllocationRoundCard } from "./components/AllocationRoundCard"
import { FiArrowUpRight } from "react-icons/fi"
import { useRouter } from "next/navigation"
import { FaChartPie } from "react-icons/fa"

type Props = {
  roundsPerPage?: number
}
export const LastAllocationRoundsList: React.FC<Props> = ({ roundsPerPage = 3 }) => {
  const router = useRouter()

  const { data: allocationRoundsEvents, error: allocationRoundEventsError } = useAllocationsRoundsEvents()
  const invertedCreatedRounds = allocationRoundsEvents?.created.slice().reverse()

  return (
    <Card w="full">
      <CardBody>
        <VStack spacing={8} w="full" align={"flex-start"}>
          <HStack w="full" justify="space-between" alignItems={"baseline"}>
            <HStack w="full" justify="flex-start">
              <Icon as={FaChartPie} />
              <Heading size="md">Allocation Rounds</Heading>
            </HStack>
            <HStack w="full" justify="flex-end">
              {invertedCreatedRounds && invertedCreatedRounds.length > roundsPerPage && (
                <Button
                  variant="link"
                  colorScheme="blue"
                  rightIcon={<FiArrowUpRight />}
                  onClick={() => router.push("/rounds")}>
                  See all rounds
                </Button>
              )}
            </HStack>
          </HStack>

          <VStack spacing={4} w="full">
            {allocationRoundEventsError && (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle>Error loading allocation rounds</AlertTitle>
                  <AlertDescription>{allocationRoundEventsError.message}</AlertDescription>
                </Box>
              </Alert>
            )}
            {invertedCreatedRounds?.slice(0, roundsPerPage)?.map((round, i) => {
              return <AllocationRoundCard round={round} key={round.roundId} variant={"compact"} />
            })}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

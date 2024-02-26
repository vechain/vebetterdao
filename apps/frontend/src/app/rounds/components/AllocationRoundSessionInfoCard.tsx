import { useAllocationRoundQuorum, useAllocationVotes, useAllocationsRound, useVot3PastSupply } from "@/api"
import { VOT3Icon } from "@/components"
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Heading,
  Icon,
  Progress,
  Skeleton,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Text,
  VStack,
  useSteps,
} from "@chakra-ui/react"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useEffect, useMemo } from "react"
import { FaClock } from "react-icons/fa6"

type Props = {
  roundId: string
}

export const AllocationRoundSessionInfoCard = ({ roundId }: Props) => {
  const { data: roundInfo } = useAllocationsRound(roundId)
  const { data: votes, isLoading: votesLoading } = useAllocationVotes(roundId)
  const { data: roundQuorum, isLoading: quorumLoading } = useAllocationRoundQuorum(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useVot3PastSupply(roundInfo.voteStart)

  const steps = useMemo(
    () => [
      { title: "Voting session started", description: roundInfo?.voteStartTimestamp?.format("MMMM D hh:mm A") },
      { title: "Voting session finished", description: roundInfo?.voteEndTimestamp?.format("MMMM D hh:mm A") },
      {
        title: "Voting rewards are claimable",
        description: "",
      },
    ],
    [roundInfo],
  )

  const { activeStep, setActiveStep } = useSteps({
    index: 1,
    count: steps.length,
  })

  useEffect(() => {
    if (roundInfo) {
      const stateNumber = Number(roundInfo.state)
      switch (stateNumber) {
        case 0:
          setActiveStep(1)
          break
        case 1:
          setActiveStep(3)
          break
        case 2:
          setActiveStep(3)
          break
      }
    }
  }, [roundInfo, setActiveStep])

  const quorumPercentage = useMemo(() => {
    return (Number(votes) / Number(roundQuorum)) * 100
  }, [votes, roundQuorum])

  console.log("quorumPercentage", quorumPercentage)
  return (
    <Card w="full">
      <CardHeader>
        <Heading size="md">Session info</Heading>
      </CardHeader>
      <CardBody>
        <VStack w="full" justify={"space-between"} spacing={4} align="flex-start">
          <Box w="full">
            <Text fontSize={"sm"} fontWeight="400">
              Real-time votes
            </Text>
            <Skeleton isLoaded={!votesLoading}>
              <HStack spacing={2}>
                <Heading size="lg">{humanNumber(votes ?? "0", votes)}</Heading>
                <VOT3Icon boxSize={6} />
              </HStack>
            </Skeleton>
            <Progress
              mt={3}
              h={2.5}
              hasStripe={true}
              value={quorumPercentage}
              colorScheme="primary"
              size="sm"
              borderRadius={"full"}
            />
            <HStack justify="space-between" w="full" mt={1}>
              <Text fontSize={"sm"} fontWeight="400">
                Quorum needed
              </Text>
              <HStack spacing={2}>
                <Icon as={FaClock} fontSize={"sm"} fontWeight={"thin"} />
                <Text fontSize={"sm"} fontWeight={"600"}>
                  {humanNumber(roundQuorum ?? "0", roundQuorum)}
                </Text>
              </HStack>
            </HStack>
          </Box>

          <HStack w="full" justify="space-between" align="center">
            <Text fontSize={"sm"} fontWeight="400">
              Votes at snapshot
            </Text>
            <Skeleton isLoaded={!votesAtSnapshotLoading}>
              <Text fontWeight={"600"} color="primary.500">
                {humanNumber(votesAtSnapshot ?? "0", votes)}
              </Text>
            </Skeleton>
          </HStack>

          <Stepper index={activeStep} orientation="vertical" gap="0" height="200px" mt={4}>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator>
                  <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
                </StepIndicator>

                <Box flexShrink="0">
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </Box>

                <StepSeparator />
              </Step>
            ))}
          </Stepper>
        </VStack>
      </CardBody>
    </Card>
  )
}

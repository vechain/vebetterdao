import {
  ProposalCreatedEvent,
  ProposalMetadata,
  ProposalState,
  useCurrentBlock,
  useProposalDeadline,
  useProposalSnapshot,
  useProposalState,
} from "@/api"
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  HStack,
  Heading,
  Skeleton,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react"
import { AddressButton } from "./AddressButton"
import { useCallback, useMemo, useState } from "react"
import { GovernanceFeaturedContractsWithFunctions, getActionsFromTargetsAndCalldatas } from "@/constants"
import { getConfig } from "@repo/config"
import { ProposalVotesProgressBar } from "./ProposalVotesProgressBar"
import { CastVoteButton } from "./CastVoteButton"
import { FaChevronRight } from "react-icons/fa6"

import { useRouter } from "next/navigation"
import { useIpfsMetadata } from "@/api/ipfs"
import { toIPFSURL } from "@/utils"
import { ProposalFormAction } from "@/store/useProposalFormStore"
import dayjs from "dayjs"
import { ProposalExecutableActions } from "./ProposalExecutableActions"

const config = getConfig()
const blockTime = config.network.blockTime
type Props = {
  proposal: ProposalCreatedEvent
}
export const ProposalCard: React.FC<Props> = ({ proposal }) => {
  const { data: state } = useProposalState(proposal.proposalId)
  const { data: currentBlock } = useCurrentBlock()
  const { data: proposalSnapshotBlock, isLoading: proposalSnapshotBlockLoading } = useProposalSnapshot(
    proposal.proposalId,
  )
  const { data: proposalDeadlineBlock, isLoading: proposalDeadlineBlockLoading } = useProposalDeadline(
    proposal.proposalId,
  )

  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(proposal.description))

  const [proposalDecodeError, setProposalDecodeError] = useState<string | null>(null)

  const actions: ProposalFormAction[] = useMemo(() => {
    try {
      setProposalDecodeError(null)
      return getActionsFromTargetsAndCalldatas(
        proposal.targets,
        proposal.callDatas,
        GovernanceFeaturedContractsWithFunctions,
      )
    } catch (e: unknown) {
      if (e instanceof Error) setProposalDecodeError(e.message)
      else {
        setProposalDecodeError("Error decoding proposal")
      }
      return []
    }
  }, [proposal])

  const isStarted = useMemo(() => {
    const startBlock = Number(proposalSnapshotBlock)
    if (!startBlock || !currentBlock) return null
    const startBlockFromNow = startBlock - currentBlock.number
    return startBlockFromNow <= 0
  }, [currentBlock, proposalSnapshotBlock])

  const isEnded = useMemo(() => {
    const endBlock = Number(proposalDeadlineBlock)
    if (!endBlock || !currentBlock) return null
    const endBlockFromNow = endBlock - currentBlock.number
    return endBlockFromNow <= 0
  }, [currentBlock, proposalDeadlineBlock])

  const estimatedEndTime = useMemo(() => {
    const endBlock = Number(proposalDeadlineBlock)
    if (!endBlock || !currentBlock) return null
    const endBlockFromNow = endBlock - currentBlock.number
    //not ended yet
    if (endBlockFromNow > 0) {
      const durationLeftTimestamp = endBlockFromNow * blockTime
      const endDate = dayjs().add(durationLeftTimestamp, "milliseconds")
      return endDate.fromNow()
    } else {
      const durationLeftTimestamp = -endBlockFromNow * blockTime
      const endDate = dayjs().subtract(durationLeftTimestamp, "milliseconds")
      return endDate.fromNow()
    }
  }, [proposalDeadlineBlock, currentBlock])

  const estimatedStartTime = useMemo(() => {
    if (!proposalSnapshotBlock) return null
    const startBlock = Number(proposalSnapshotBlock)
    if (!startBlock || !currentBlock) return null
    const startBlockFromNow = startBlock - currentBlock.number
    //not started yet
    if (startBlockFromNow > 0) {
      const durationLeftTimestamp = startBlockFromNow * blockTime
      const startDate = dayjs().add(durationLeftTimestamp, "milliseconds")
      return startDate.fromNow()
    } else return "Started"
  }, [proposalSnapshotBlock, currentBlock])

  const proposalStateTagColor = useMemo(() => {
    switch (state) {
      case 7:
        return "green"
      case 6:
        return "red"
      case 5:
        return "blue"
      case 4:
        return "green"
      case 3:
        return "red"
      case 2:
        return "red"
      case 1:
        return "green"
      case 0:
        return "orange"
      default:
        return "gray"
    }
  }, [state])

  const router = useRouter()
  const goToProposal = useCallback(() => {
    router.push(`/proposals/${proposal.proposalId}`)
  }, [router, proposal])

  return (
    <Card flex={1}>
      <CardBody>
        <VStack spacing={4} w="full" align="flex-start">
          <HStack w="full" justify="space-between">
            <Tag colorScheme="blue">Governance</Tag>
            <Tag colorScheme={proposalStateTagColor}>{state !== undefined ? ProposalState[state] : "N/A"}</Tag>
          </HStack>
          <HStack justify={"space-between"} w="full">
            <Heading size="sm"> Proposer</Heading>
            <AddressButton address={proposal.proposer} buttonSize="xs" addressFontSize="xs" />
          </HStack>
          <Box>
            <Skeleton isLoaded={!proposalMetadata.isLoading}>
              <Heading as="h3" size="md" color={proposalMetadata.error ? "red.500" : "inherit"}>
                {proposalMetadata.error?.message
                  ? "Error fetching metadata"
                  : proposalMetadata.data?.title ?? "Loading..."}
              </Heading>
            </Skeleton>
            <Skeleton isLoaded={!proposalMetadata.isLoading}>
              <Text size="xs" color={proposalMetadata.error ? "red.500" : "inherit"}>
                {proposalMetadata.error?.message
                  ? "Error fetching metadata"
                  : proposalMetadata.data?.shortDescription ?? "Loading..."}
              </Text>
            </Skeleton>
          </Box>
        </VStack>
        <Divider my={4} />
        <VStack spacing={8} w="full" align="center">
          {proposalDecodeError && (
            <Alert status="error" borderRadius={"lg"}>
              <AlertIcon />
              <Box>
                <AlertTitle>Error decoding the proposal calldatas</AlertTitle>
                <AlertDescription>{proposalDecodeError}</AlertDescription>
              </Box>
            </Alert>
          )}
          {!!actions.length && <ProposalExecutableActions actions={actions} />}
          <ProposalVotesProgressBar proposal={proposal} />
        </VStack>
      </CardBody>
      <CardFooter>
        <VStack spacing={4} align={"flex-start"} w="full">
          <HStack justify={"space-between"} w="full">
            {isStarted ? (
              <Box>
                <Skeleton isLoaded={!!estimatedEndTime}>
                  <Heading as="h4" size="sm" color="orange">
                    {isEnded ? "Ended" : "Ends"} {estimatedEndTime}
                  </Heading>
                </Skeleton>
                <Skeleton isLoaded={!proposalDeadlineBlockLoading}>
                  <Text fontWeight={"normal"} fontSize={"sm"}>
                    At block #{proposalDeadlineBlock}
                  </Text>
                </Skeleton>
              </Box>
            ) : (
              <Box>
                <Skeleton isLoaded={!!estimatedStartTime}>
                  <Heading as="h4" size="sm" color="orange">
                    {"Starts"} in round #{proposal.roundIdVoteStart}
                  </Heading>
                </Skeleton>
              </Box>
            )}
            <CastVoteButton proposal={proposal} />
            <Button size="sm" colorScheme="blue" rounded={"full"} rightIcon={<FaChevronRight />} onClick={goToProposal}>
              See More
            </Button>
          </HStack>
        </VStack>
      </CardFooter>
    </Card>
  )
}

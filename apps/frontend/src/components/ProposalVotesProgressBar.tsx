import {
  ProposalCreatedEvent,
  useCurrentBlock,
  useProposalQuorum,
  useProposalSnapshot,
  useProposalVotesIndexer,
} from "@/api"
import { Box, HStack, Heading, Icon, Progress, Skeleton, Text } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa6"
const blockTime = getConfig().network.blockTime
const compactFormatter = getCompactFormatter()

type Props = {
  proposal: ProposalCreatedEvent
}

export const ProposalVotesProgressBar: React.FC<Props> = ({ proposal }) => {
  const { t } = useTranslation()

  const { data: proposalVotes, isLoading: proposalVotesLoading } = useProposalVotesIndexer({
    proposalId: proposal.proposalId,
  })
  const { data: proposalSnapshotBlock } = useProposalSnapshot(proposal.proposalId)

  const { data: quorum, isLoading: quorumLoading } = useProposalQuorum(proposalSnapshotBlock)
  const { data: currentBlock } = useCurrentBlock()

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

  const isIncoming = useMemo(() => {
    const startBlock = Number(proposalSnapshotBlock)
    if (!startBlock || !currentBlock) return null
    const startBlockFromNow = startBlock - currentBlock.number
    return startBlockFromNow >= 0
  }, [proposalSnapshotBlock, currentBlock])

  const totalVotes = useMemo(() => {
    if (!proposalVotes || proposalVotes?.length !== 3) return BigInt(0)

    const forVotes = BigInt(proposalVotes[0]?.totalWeight ?? "0")
    const againstVotes = BigInt(proposalVotes[1]?.totalWeight ?? "0")
    const abstainVotes = BigInt(proposalVotes[2]?.totalWeight ?? "0")

    return forVotes + againstVotes + abstainVotes
  }, [proposalVotes])

  const forVotes = useMemo(() => {
    if (!proposalVotes || proposalVotes?.length !== 3) return BigInt(0)

    return BigInt(proposalVotes[0]?.totalWeight ?? "0")
  }, [proposalVotes])

  const againstVotes = useMemo(() => {
    if (!proposalVotes || proposalVotes?.length !== 3) return BigInt(0)

    return BigInt(proposalVotes[1]?.totalWeight ?? "0")
  }, [proposalVotes])

  const abstainVotes = useMemo(() => {
    if (!proposalVotes || proposalVotes?.length !== 3) return BigInt(0)

    return BigInt(proposalVotes[2]?.totalWeight ?? "0")
  }, [proposalVotes])

  const progress = useMemo(() => {
    if (!proposalVotes) return 0

    const progress = (forVotes * BigInt(10000)) / totalVotes // Multiply by 10000 for precision, then divide

    return Number(progress) / 100 // Return as a number with two decimal places
  }, [proposalVotes, forVotes, totalVotes])

  const quorumProgress = useMemo(() => {
    const compactQuorum = compactFormatter.format(Number(quorum))
    const isLoaded = !quorumLoading && !proposalVotesLoading

    if (!isLoaded)
      return (
        <Skeleton>
          <Heading size="sm" color="gray.500" textAlign={"center"}>
            {t("100k votes needed to reach quorum")}
          </Heading>
        </Skeleton>
      )

    if (isIncoming)
      return (
        <Heading size="xs" color="gray.500" textAlign={"center"}>
          {t("Quorum available")} {estimatedStartTime}
        </Heading>
      )
    if (totalVotes > Number(quorum)) {
      return (
        <Heading size="xs" color="green.500" textAlign={"center"}>
          {t("Quorum reached")}
        </Heading>
      )
    }
    return (
      <Heading size="xs" color="orange.500" textAlign={"center"}>
        {compactQuorum} {t("votes needed to reach quorum")}
      </Heading>
    )
  }, [quorum, quorumLoading, proposalVotesLoading, t, isIncoming, estimatedStartTime, totalVotes])

  return (
    <Box w="80%" alignSelf={"center"}>
      {quorumProgress}
      <HStack w="full">
        <HStack spacing={1}>
          <Icon as={FaThumbsUp} color="green.500" fontSize={"md"} />
          <Text fontSize="sm" color="gray.500">
            {compactFormatter.format(forVotes)}
          </Text>
        </HStack>

        <Progress w="full" colorScheme="green" size="lg" value={progress} borderRadius={"lg"} />
        <HStack spacing={1}>
          <Icon as={FaThumbsDown} color="red.500" fontSize={"md"} />
          <Text fontSize="sm" color="gray.500">
            {compactFormatter.format(againstVotes)}
          </Text>
        </HStack>
      </HStack>
      <Text fontSize="sm" color="gray.500" textAlign={"center"}>
        {compactFormatter.format(abstainVotes)} {t("preferred to abastain")}
      </Text>
    </Box>
  )
}

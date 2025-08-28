import React, { useMemo } from "react"
import { useProposalDepositEvent } from "@/api/contracts/governance/hooks/useProposalDepositEvent"
import { useIsDepositReached } from "@/api/contracts/governance/hooks/useIsDepositReached"
import { ProposalState, useProposalVotesIndexer, useProposalCreatedEvent } from "@/api"
import { Box, Card, HStack, Icon, Image, Text, VStack } from "@chakra-ui/react"
import { UilBan, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"
import { FaRegHeart } from "react-icons/fa6"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { ProposalYourVote } from "./ProposalYourVote"

const forColor = "#3DBA67"
const againstColor = "#C84968"
const abstainColor = "#B59525"

const compactFormatter = getCompactFormatter(1)

interface VotingProposalProgressProps {
  proposalId: string
  proposalState: ProposalState
}

const VotingProposalProgress: React.FC<VotingProposalProgressProps> = ({ proposalId, proposalState }) => {
  const { t } = useTranslation()
  const { data: proposalVotes } = useProposalVotesIndexer({ proposalId })

  const votes = {
    for: {
      color: forColor,
      percentage: proposalVotes?.votes.for.percentagePower ?? 0,
      icon: <Icon as={UilThumbsUp} boxSize={["20px", "20px", "16px"]} />,
    },
    against: {
      color: againstColor,
      percentage: proposalVotes?.votes.against.percentagePower ?? 0,
      icon: <Icon as={UilThumbsDown} boxSize={["20px", "20px", "16px"]} />,
    },

    abstain: {
      color: abstainColor,
      percentage: proposalVotes?.votes.abstain.percentagePower ?? 0,
      icon: <Image src={"/assets/icons/abstained.svg"} alt="abstained" boxSize={["20px", "20px", "16px"]} />,
    },
  }

  const getProposalData = () => {
    if (proposalState === ProposalState.Canceled)
      return (
        <VStack w={"full"} gap={1} align={"center"}>
          <Icon as={UilBan} boxSize={["28px", "28px", "24px"]} color={againstColor} />
          <Text textStyle={["md", "md", "xs"]} color={"#6A6A6A"} textAlign={"center"}>
            {t("Proposal canceled by creator or VeBetter")}
          </Text>
        </VStack>
      )

    if ([ProposalState.Pending, ProposalState.DepositNotMet].includes(proposalState))
      return <VotingSupportProgress proposalId={proposalId} proposalState={proposalState} />

    return (
      <VStack w={"full"} gap={3}>
        <HStack w={"full"} justifyContent={"space-between"}>
          {Object.keys(votes).map(key => {
            const vote = votes[key as keyof typeof votes]
            return (
              <HStack key={key} color={vote.color}>
                {vote.icon}
                <Text textStyle={["md", "md", "xs"]}>
                  {getCompactFormatter(1).format(vote.percentage)} {t("%")}
                </Text>
              </HStack>
            )
          })}
        </HStack>

        <Box position="relative" height="8px" width="100%" bg={"gray.200"} borderRadius="md">
          {Object.keys(votes).map((key, index) => {
            const vote = votes[key as keyof typeof votes]
            // the sum of all the percentages before this
            const left = Object.keys(votes).reduce((acc, curr, i) => {
              if (i < index) {
                return acc + votes[curr as keyof typeof votes].percentage
              }
              return acc
            }, 0)

            const borderLeftRadius = index === 0 ? "md" : 0
            const borderRightRadius =
              index === Object.keys(votes).length - 1 ||
              (index === Object.keys(votes).length - 2 && votes.abstain.percentage === 0)
                ? "md"
                : 0
            return (
              <Box
                key={key}
                height="100%"
                width={`${vote.percentage}%`}
                bg={vote.color}
                borderLeftRadius={borderLeftRadius}
                borderRightRadius={borderRightRadius}
                position="absolute"
                style={{ left: `${left}%` }}
              />
            )
          })}
        </Box>
        <ProposalYourVote
          proposalId={proposalId}
          proposalState={proposalState}
          renderTitle={false}
          textProps={{
            fontSize: "12px",
          }}
        />
      </VStack>
    )
  }

  return (
    <Card.Root variant="filledWithBorder" w="full">
      <Card.Body>{getProposalData()}</Card.Body>
    </Card.Root>
  )
}

type VotingSupportProgress = {
  proposalId: string
  state: ProposalState
}

enum DepositStateColor {
  DEPOSIT_REACHED = "rgba(0, 76, 252, 1)", // Blue
  NOT_PENDING = "rgba(210, 63, 99, 1)", // Red
  DEFAULT = "#F29B32", // Orange
}

const VotingSupportProgress: React.FC<VotingProposalProgressProps> = ({ proposalId, proposalState }) => {
  const { t } = useTranslation()
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const { data: isDepositReached } = useIsDepositReached(proposalId)

  const proposalDepositEvent = useProposalDepositEvent(proposalId)

  const depositThreshold = Number(ethers.formatEther(BigInt(proposalCreatedEvent.data?.depositThreshold || 0)))
  const communityDeposits = proposalDepositEvent.communityDeposits
  const communityDepositPercentage = compactFormatter.format((communityDeposits / depositThreshold) * 100)

  const hasUserDeposited = useMemo(() => {
    if (!proposalDepositEvent) return false

    return proposalDepositEvent.userSupport > 0
  }, [proposalDepositEvent])

  const stateColor = useMemo(() => {
    if (isDepositReached) {
      return DepositStateColor.DEPOSIT_REACHED
    } else if (proposalState !== ProposalState.Pending) {
      return DepositStateColor.NOT_PENDING
    } else {
      return DepositStateColor.DEFAULT
    }
  }, [isDepositReached, proposalState])

  return (
    <VStack w={"full"} gap={1}>
      <HStack w="full">
        <Icon as={FaRegHeart} boxSize={["20px", "20px", "16px"]} color={stateColor} />

        <Text textStyle={"md"} color={stateColor}>
          <b>{isDepositReached ? 100 : communityDepositPercentage}</b> {t("%")}
        </Text>
      </HStack>
      <Box position="relative" height="8px" width="100%" mt={2} bg={"gray.200"} borderRadius="md">
        <Box
          height="100%"
          width={`${communityDepositPercentage}%`}
          bg={stateColor}
          borderRadius="md"
          position="absolute" //inverse if isForGreaterThanAgainst is true
          style={{ left: 0 }}
        />
      </Box>
      {hasUserDeposited === true ? (
        <Text textStyle="xs" color={"#6A6A6A"} mt={1}>
          {t("You ")}
          <b>{t("Supported")}</b>
        </Text>
      ) : (
        <Text textStyle="xs" color={"#6A6A6A"} mt={1}>
          {t("You haven't supported")}
        </Text>
      )}
    </VStack>
  )
}

export default VotingProposalProgress

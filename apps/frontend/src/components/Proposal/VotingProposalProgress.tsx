import React, { useMemo } from "react"
import { useProposalDepositEvent } from "@/api/contracts/governance/hooks/useProposalDepositEvent"
import { useIsDepositReached } from "@/api/contracts/governance/hooks/useIsDepositReached"
import { ProposalState, useProposalCreatedEvent, useProposalVoteEvents, useProposalVotes } from "@/api"
import { Box, Card, CardBody, HStack, Icon, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilBan, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"
import { FaRegHeart } from "react-icons/fa6"

const forColor = "#3DBA67"
const againstColor = "#C84968"
const abstainColor = "#B59525"
interface VotingProposalProgressProps {
  proposalId: string
  proposalState: ProposalState
}

const VotingProposalProgress: React.FC<VotingProposalProgressProps> = ({ proposalId, proposalState }) => {
  const { t } = useTranslation()
  const { data: proposalVotes } = useProposalVotes(proposalId)
  const { data: votesEvents, isLoading: votesEventsLoading } = useProposalVoteEvents(proposalId)

  const forVotesPercentage = Number(proposalVotes?.forPercentage || 0)
  const againstVotesPercentage = Number(proposalVotes?.againstPercentage || 0)
  const abstainVotesPercentage = Number(proposalVotes?.abstainPercentage || 0)

  const getVoteType = useMemo(() => {
    switch (votesEvents?.userVote?.support) {
      case "0":
        return "Against"
      case "1":
        return "For"
      case "2":
        return "Abstain"
      default:
        return null
    }
  }, [votesEvents])

  const votes = {
    for: {
      color: forColor,
      percentage: forVotesPercentage,
      icon: <Icon as={UilThumbsUp} boxSize={["20px", "20px", "16px"]} />,
    },
    against: {
      color: againstColor,
      percentage: againstVotesPercentage,
      icon: <Icon as={UilThumbsDown} boxSize={["20px", "20px", "16px"]} />,
    },

    abstain: {
      color: abstainColor,
      percentage: abstainVotesPercentage,
      icon: <Image src={"/images/abstained.svg"} alt="abstained" boxSize={["20px", "20px", "16px"]} />,
    },
  }

  const getProposalData = () => {
    if (proposalState === ProposalState.Canceled)
      return (
        <VStack w={"full"} spacing={1} align={"center"}>
          <Icon as={UilBan} boxSize={["28px", "28px", "24px"]} color={againstColor} />
          <Text fontSize={["16px", "16px", "12px"]} fontWeight={400} color={"#6A6A6A"} textAlign={"center"}>
            {t("Proposal canceled by creator or VeBetter")}
          </Text>
        </VStack>
      )

    if ([ProposalState.Pending, ProposalState.DepositNotMet].includes(proposalState))
      return <VotingSupportProgress proposalId={proposalId} proposalState={proposalState} />

    return (
      <VStack w={"full"} spacing={1}>
        <HStack w={"full"} justifyContent={"space-between"}>
          {Object.keys(votes).map(key => {
            const vote = votes[key as keyof typeof votes]
            return (
              <HStack key={key} color={vote.color}>
                {vote.icon}
                <Text fontSize={["16px", "16px", "12px"]} fontWeight={400}>
                  {vote.percentage.toFixed(0)} {t("%")}
                </Text>
              </HStack>
            )
          })}
        </HStack>

        <Box position="relative" height="8px" width="100%" mt={2} bg={"gray.200"} borderRadius="md">
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
            const borderRightRadius = index === Object.keys(votes).length - 1 ? "md" : 0
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
          <Box height="100%" width={`${forVotesPercentage}%`} bg={"##3DBA67"} borderRadius="md" position="absolute" />
        </Box>
        <Skeleton isLoaded={!votesEventsLoading}>
          {votesEvents?.hasUserVoted === true ? (
            <Text fontSize={12} color={"#6A6A6A"} fontWeight={400} mt={1}>
              {t("You voted")}
              <b
                style={{
                  color:
                    getVoteType === "For"
                      ? "rgba(56, 191, 102, 1)"
                      : getVoteType === "Abstain"
                        ? "rgba(181, 149, 37, 1)"
                        : "rgba(210, 63, 99, 1)",
                  marginLeft: 2,
                }}>
                {getVoteType}
              </b>
            </Text>
          ) : (
            <Text fontSize={12} color={"#6A6A6A"} fontWeight={400} mt={1}>
              {t("You haven't voted")}
            </Text>
          )}
        </Skeleton>
      </VStack>
    )
  }

  return (
    <Card variant="filledWithBorder" w="full">
      <CardBody>{getProposalData()}</CardBody>
    </Card>
  )
}

type VotingSupportProgress = {
  proposalId: string
  state: ProposalState
}

const VotingSupportProgress: React.FC<VotingProposalProgressProps> = ({ proposalId, proposalState }) => {
  const { t } = useTranslation()
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const { data: isDepositReached } = useIsDepositReached(proposalId)

  const proposalDepositEvent = useProposalDepositEvent(proposalId)

  const depositThreshold = Number(ethers.formatEther(BigInt(proposalCreatedEvent.data?.depositThreshold || 0)))
  const communityDeposits = proposalDepositEvent.communityDeposits
  const communityDepositPercentage = (communityDeposits / depositThreshold) * 100

  const hasUserDeposited = useMemo(() => {
    if (!proposalDepositEvent) return false

    return proposalDepositEvent.userSupport > 0
  }, [proposalDepositEvent])

  return (
    <VStack w={"full"} spacing={1}>
      <HStack w={"full"} justifyContent={"space-between"}>
        <HStack>
          <Icon
            as={FaRegHeart}
            boxSize={["20px", "20px", "16px"]}
            color={
              isDepositReached
                ? "rgba(0, 76, 252, 1)"
                : proposalState !== ProposalState.Pending
                  ? "rgba(210, 63, 99, 1)"
                  : "#F29B32"
            }
          />

          <Text
            fontSize={"16px"}
            fontWeight={400}
            color={
              isDepositReached
                ? "rgba(0, 76, 252, 1)"
                : proposalState !== ProposalState.Pending
                  ? "rgba(210, 63, 99, 1)"
                  : "#F29B32"
            }>
            <b>{isDepositReached ? 100 : communityDepositPercentage.toFixed(0)}</b> {t("%")}
          </Text>
        </HStack>
      </HStack>
      <Box position="relative" height="8px" width="100%" mt={2} bg={"gray.200"} borderRadius="md">
        <Box
          height="100%"
          width={`${communityDepositPercentage}%`}
          bg={
            isDepositReached
              ? "rgba(0, 76, 252, 1)"
              : proposalState !== ProposalState.Pending
                ? "rgba(210, 63, 99, 1)"
                : "#F29B32"
          }
          borderRadius="md"
          position="absolute" //inverse if isForGreaterThanAgainst is true
          style={{ left: 0 }}
        />
      </Box>
      {hasUserDeposited === true ? (
        <Text fontSize={12} color={"#6A6A6A"} fontWeight={400} mt={1}>
          {t("You ")}
          <b>{t("Supported")}</b>
        </Text>
      ) : (
        <Text fontSize={12} color={"#6A6A6A"} fontWeight={400} mt={1}>
          {t("You haven't supported")}
        </Text>
      )}
    </VStack>
  )
}

export default VotingProposalProgress

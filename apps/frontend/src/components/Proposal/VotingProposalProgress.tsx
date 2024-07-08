import React, { useMemo } from "react"
import { useProposalDepositEvent } from "@/api/contracts/governance/hooks/useProposalDepositEvent"
import { useIsDepositReached } from "@/api/contracts/governance/hooks/useIsDepositReached"
import { ProposalState, useProposalCreatedEvent, useProposalVoteEvent, useProposalVotes } from "@/api"
import { Box, Card, CardBody, HStack, Text, VStack } from "@chakra-ui/react"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"
import { FaRegHeart } from "react-icons/fa6"

interface VotingProposalProgressProps {
  proposalId: string
  proposalState: ProposalState
}

const VotingProposalProgress: React.FC<VotingProposalProgressProps> = ({ proposalId, proposalState }) => {
  const proposalDepositEvent = useProposalDepositEvent(proposalId)
  const isDepositReached = useIsDepositReached(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const { data: proposalVotes } = useProposalVotes(proposalId)
  const { hasUserVoted, userVote } = useProposalVoteEvent(proposalId)

  const hasUserDeposited = useMemo(() => {
    if (!proposalDepositEvent) return false

    return proposalDepositEvent.userSupport > 0
  }, [proposalDepositEvent])

  const depositThreshold = Number(ethers.formatEther(BigInt(proposalCreatedEvent.data?.depositThreshold || 0)))
  const communityDeposits = proposalDepositEvent.communityDeposits
  const communityDepositPercentage = (communityDeposits / depositThreshold) * 100

  const totalVotes =
    Number(proposalVotes?.abstainVotes) + Number(proposalVotes?.againstVotes) + Number(proposalVotes?.forVotes)
  const forPercentage = (Number(proposalVotes?.forVotes) / totalVotes) * 100 || 0

  const againstAndAbstainPercentage = Number(totalVotes) > 0 ? 100 - forPercentage : 0

  const isPending = useMemo(() => proposalState === ProposalState.Pending, [proposalState])
  const isSupportNotMet = useMemo(() => proposalState === ProposalState.DepositNotMet, [proposalState])

  const isForGreaterThanAgainst = forPercentage > againstAndAbstainPercentage

  const getVoteType = useMemo(() => {
    switch (userVote?.support) {
      case "0":
        return "Against"
      case "1":
        return "For"
      case "2":
        return "Abstain"
      default:
        return null
    }
  }, [userVote])

  const { t } = useTranslation()

  const progressBarBg = useMemo(() => {
    return Number(totalVotes) > 0 ? "rgba(210, 63, 99, 1)" : "gray.200"
  }, [totalVotes])

  const isDepositFulfilled = useMemo(() => {
    if (!isDepositReached.data) return false

    return isDepositReached.data
  }, [isDepositReached])

  const getProposalData = () => {
    if (isPending || isSupportNotMet) {
      return (
        <VStack w={"full"} spacing={1}>
          <HStack w={"full"} justifyContent={"space-between"}>
            <HStack>
              <FaRegHeart
                width={18}
                height={18}
                color={
                  isDepositFulfilled ? "rgba(0, 76, 252, 1)" : isPending === false ? "rgba(210, 63, 99, 1)" : "#F29B32"
                }
              />
              <Text
                fontSize={16}
                fontWeight={600}
                color={
                  isDepositFulfilled ? "rgba(0, 76, 252, 1)" : isPending === false ? "rgba(210, 63, 99, 1)" : "#F29B32"
                }>
                {isDepositFulfilled ? 100 : communityDepositPercentage.toFixed(0)} {t("%")}
              </Text>
            </HStack>
          </HStack>
          <Box position="relative" height="8px" width="100%" mt={2} bg={progressBarBg} borderRadius="md">
            <Box
              height="100%"
              width={`${communityDepositPercentage}%`}
              bg={isDepositFulfilled ? "rgba(0, 76, 252, 1)" : isPending === false ? "rgba(210, 63, 99, 1)" : "#F29B32"}
              borderRadius="md"
              position="absolute" //inverse if isForGreaterThanAgainst is true
              style={{ right: isForGreaterThanAgainst ? 0 : undefined }}
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
    } else {
      return (
        <VStack w={"full"} spacing={1}>
          <HStack w={"full"} justifyContent={"space-between"}>
            <HStack>
              <UilThumbsUp width={18} height={18} color="rgba(56, 191, 102, 1)" />
              <Text fontSize={16} fontWeight={600} color={"rgba(56, 191, 102, 1)"}>
                {forPercentage.toFixed(0)} {t("%")}
              </Text>
            </HStack>
            <HStack>
              <UilThumbsDown width={18} height={18} color="rgba(210, 63, 99, 1)" />
              <Text fontSize={16} fontWeight={600} color={"rgba(210, 63, 99, 1)"}>
                {againstAndAbstainPercentage.toFixed(0)} {t("%")}
              </Text>
            </HStack>
          </HStack>
          <Box position="relative" height="8px" width="100%" mt={2} bg={progressBarBg} borderRadius="md">
            <Box
              height="100%"
              width={`${forPercentage}%`}
              bg={"rgba(56, 191, 102, 1)"}
              borderRadius="md"
              position="absolute" //inverse if isForGreaterThanAgainst is true
            />
          </Box>
          {hasUserVoted === true ? (
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
        </VStack>
      )
    }
  }

  return (
    <Card variant="filledWithBorder" w="full">
      <CardBody>{getProposalData()}</CardBody>
    </Card>
  )
}

export default VotingProposalProgress

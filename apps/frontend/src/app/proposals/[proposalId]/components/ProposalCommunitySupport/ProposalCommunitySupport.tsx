import { Card, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { CommunitySupportButton } from "./components/CommunitySupportButton"
import { ProposalState, useTotalVotesOnBlock } from "@/api"
import { useMemo, useRef, useEffect } from "react"
import { ProposalWithdrawButton } from "../ProposalWithdrawButton"
import { useProposalDetail } from "../../hooks"
import { ProposalSupportProgressChart } from "@/components/ProposalSupportProgressChart/ProposalSupportProgressChart"
import { Tooltip } from "@/components/ui/tooltip"
import { useWallet } from "@vechain/vechain-kit"

export const ProposalCommunitySupport = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()

  const { account } = useWallet()
  const userDepositsVotes = useTotalVotesOnBlock(
    proposal.votingStartDate ? Number(proposal.votingStartDate) : undefined,
    account?.address ?? "",
  )

  const isDepositNotMet = proposal.state === ProposalState.DepositNotMet

  const lastKnownValueRef = useRef<string | number>(0)

  useEffect(() => {
    if (userDepositsVotes.data?.depositsVotes && Number(userDepositsVotes.data.depositsVotes) > 0) {
      lastKnownValueRef.current = userDepositsVotes.data.depositsVotes
    }
  }, [userDepositsVotes.data?.depositsVotes])

  // Use the stable value that doesn't reset during refetches
  const totalDepositsVotingPower = useMemo(() => {
    // If we have current data, use it; otherwise use the last known value
    if (userDepositsVotes.data?.depositsVotes) {
      return userDepositsVotes.data.depositsVotes
    }
    return lastKnownValueRef.current
  }, [userDepositsVotes.data?.depositsVotes])

  // Only show card when we have a positive value
  const shouldShowDepositCard = useMemo(() => {
    return Number(totalDepositsVotingPower) > 0
  }, [totalDepositsVotingPower])

  const boxShadow = useMemo(() => {
    if (isDepositNotMet) {
      return "0px 0px 5px 0px rgba(210, 63, 99, 0.40)"
    }
    if (proposal.isDepositReached) {
      return undefined
    }
    return "0px 0px 16px 0px #004CFC59"
  }, [isDepositNotMet, proposal.isDepositReached])

  const borderColor = useMemo(() => {
    if (isDepositNotMet) {
      return "#EC9BAF"
    }
    if (proposal.isDepositReached) {
      return "#6DCB09"
    }
    return "#004CFC"
  }, [isDepositNotMet, proposal.isDepositReached])

  if (proposal.state !== ProposalState.Pending && proposal.state !== ProposalState.DepositNotMet) {
    return null
  }
  return (
    <Card.Root border={`1px solid ${borderColor}`} rounded="16px" p="24px" boxShadow={boxShadow}>
      <VStack alignItems={"stretch"} gap={6}>
        <HStack justify="space-between">
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Community Support")}
          </Heading>
          <Tooltip content={t("You will not be able to vote on this proposal with the tokens used for support.")}>
            <UilInfoCircle size="24px" color={"#004CFC"} />
          </Tooltip>
        </HStack>
        <Text fontSize={"14px"}>
          {isDepositNotMet
            ? t("This proposal won’t reach enough support and it was canceled.")
            : t("This proposal needs to get enough support for the community to be voted on Round {{round}}.", {
                round: proposal.roundIdVoteStart,
              })}
        </Text>
        <ProposalSupportProgressChart
          isDepositThresholdReached={proposal.isDepositReached}
          isFailedDueToDeposit={isDepositNotMet}
          depositThreshold={proposal.depositThreshold}
          userDeposits={proposal.userSupport}
          othersDeposits={proposal.othersSupport}
          otherDepositsUsersCount={proposal.othersSupportUserCount}
        />

        {/* Total Deposit Voting Power Section */}
        {shouldShowDepositCard && (
          <Card.Root bg="rgba(0, 76, 252, 0.05)" border="1px solid rgba(0, 76, 252, 0.2)" rounded="12px" p="16px">
            <VStack alignItems="stretch" gap={3}>
              <HStack justify="space-between" align="baseline">
                <HStack>
                  <Text fontSize="24px" fontWeight={700} color="#004CFC">
                    {Number(totalDepositsVotingPower).toLocaleString()}
                  </Text>
                  <Tooltip
                    content={t(
                      "This is your additional voting power from deposits across all proposals you've supported. This voting power is available for allocation voting.",
                    )}>
                    <UilInfoCircle size="16px" color={"#004CFC"} />
                  </Tooltip>
                </HStack>
                <Text fontSize="12px" color="#6A6A6A">
                  {t("VOT3 from all proposals")}
                </Text>
              </HStack>

              <Text fontSize="12px" color="#6A6A6A">
                {t("Available for allocation voting in addition to your regular VOT3 balance")}
              </Text>
            </VStack>
          </Card.Root>
        )}
        {isDepositNotMet ? (
          <>
            {proposal.isUserSupportLeft && (
              <HStack justify={"flex-end"}>
                <ProposalWithdrawButton />
              </HStack>
            )}
          </>
        ) : (
          <HStack alignItems={"flex-end"} justify={"space-between"} flexWrap={"wrap"}>
            <Text fontSize="14px" fontWeight={600}>
              {t(
                "Each deposit is counted in the allocation voting. You can claim your tokens back when the proposal voting round starts.",
              )}
            </Text>
            <CommunitySupportButton />
          </HStack>
        )}
      </VStack>
    </Card.Root>
  )
}

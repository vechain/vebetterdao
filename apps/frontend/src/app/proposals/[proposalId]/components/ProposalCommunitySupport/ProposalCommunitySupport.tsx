import { Card, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { CommunitySupportButton } from "./components/CommunitySupportButton"
import { ProposalState } from "@/api"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { ProposalWithdrawButton } from "../ProposalWithdrawButton"
import { useProposalDetail } from "../../hooks"
import { ProposalSupportProgressChart } from "@/components/ProposalSupportProgressChart/ProposalSupportProgressChart"

export const ProposalCommunitySupport = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()

  const isDepositNotMet = proposal.state === ProposalState.DepositNotMet

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
    <Card border={`1px solid ${borderColor}`} rounded="16px" p="24px" boxShadow={boxShadow}>
      <VStack alignItems={"stretch"} gap={6}>
        <HStack justify="space-between">
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Community Support")}
          </Heading>
          <UilInfoCircle size="24px" color={"#004CFC"} />
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
              {t("You will be able to claim your tokens back when the voting round ends.")}
            </Text>
            <CommunitySupportButton />
          </HStack>
        )}
      </VStack>
    </Card>
  )
}

import { ProposalState } from "@/api"
import { HStack, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../../hooks"
import { FaRegHeart } from "react-icons/fa6"

export const ProposalOverviewCommunitySupport = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()

  const supportIconColor = useMemo(() => {
    if (proposal.state === ProposalState.DepositNotMet) {
      return "#D23F63"
    }
    if (proposal.state === ProposalState.Pending) {
      return proposal.isDepositReached ? "#6DCB09" : "#F29B32"
    }
  }, [proposal])

  switch (proposal.state) {
    case ProposalState.DepositNotMet:
    case ProposalState.Pending:
      return (
        <VStack alignItems={"stretch"}>
          <Text fontWeight={"400"} color="#6A6A6A">
            {t("Community Support")}
          </Text>
          <HStack>
            <FaRegHeart color={supportIconColor} />
            <Text color="#252525">
              {t("{{percentage}}%", { percentage: Math.floor(proposal.communityDepositPercentage * 100) })}
            </Text>
          </HStack>
        </VStack>
      )
  }
}

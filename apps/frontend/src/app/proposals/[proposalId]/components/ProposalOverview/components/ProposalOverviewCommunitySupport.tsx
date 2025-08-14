import { Box, HStack, Text } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../../hooks"
import { FaRegHeart } from "react-icons/fa6"
import { ProposalState } from "@/hooks/proposals/grants/types"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

const compactFormatter = getCompactFormatter(1)
export const ProposalOverviewCommunitySupport = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()

  const percentage = Math.min(proposal.communityDepositPercentage * 100, 100)
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
        <Box>
          <Text fontWeight={"400"} color="#6A6A6A">
            {t("Community Support")}
          </Text>
          <HStack>
            <FaRegHeart color={supportIconColor} />
            <Text>{t("{{percentage}}%", { percentage: compactFormatter.format(percentage) })}</Text>
          </HStack>
        </Box>
      )
  }
}

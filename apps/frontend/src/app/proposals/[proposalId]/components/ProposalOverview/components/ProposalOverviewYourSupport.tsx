import { ProposalState } from "@/api"
import { Box, HStack, Image, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../../hooks"

const compactFormatter = getCompactFormatter(2)

export const ProposalOverviewYourSupport = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()

  switch (proposal.state) {
    case ProposalState.DepositNotMet:
    case ProposalState.Pending:
      return (
        <Box>
          <Text fontWeight={"400"} color="#6A6A6A">
            {t("Your support")}
          </Text>
          <HStack gap={2}>
            <Image h="20px" w="20px" src="/assets/tokens/vot3-token.webp" alt="vot3-token" />
            <Text fontWeight={600}>{compactFormatter.format(Number(proposal.userSupport))}</Text>
          </HStack>
        </Box>
      )
  }
}

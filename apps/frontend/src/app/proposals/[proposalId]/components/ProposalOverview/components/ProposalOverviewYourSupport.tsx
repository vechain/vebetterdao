import { ProposalState, useCurrentProposal } from "@/api"
import { HStack, Image, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)

export const ProposalOverviewYourSupport = () => {
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()

  switch (proposal.state) {
    case ProposalState.Active:
    case ProposalState.DepositNotMet:
    case ProposalState.Pending:
      return (
        <VStack alignItems={"stretch"}>
          <Text fontWeight={"400"} color="#6A6A6A">
            {t("Your support")}
          </Text>
          <HStack gap={2}>
            <Image h="20px" w="20px" src="/images/vot3-token.png" alt="vot3-token" />
            <Text color="#252525" fontWeight={600}>
              {compactFormatter.format(Number(proposal.userSupport))}
            </Text>
            <Text color="#252525">{t("V3")}</Text>
          </HStack>
        </VStack>
      )
  }
}

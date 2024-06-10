import { ProposalState, useVot3Balance } from "@/api"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { HStack, Image, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)

export const ProposalSessionVot3 = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data } = useVot3Balance(account || "")

  return (
    <HStack p="16px" rounded="12px" bg="#FAFAFA" justify={"space-between"}>
      {proposal.state !== ProposalState.Pending && (
        <VStack align="stretch" gap={0}>
          <HStack>
            <Text color="#004CFC" fontWeight={600}>
              {compactFormatter.format(Number(proposal.userVot3OnSnapshot))}
            </Text>
          </HStack>
          <Text color="#6A6A6A" fontSize="12px">
            {t("Votes at snapshot")}
          </Text>
        </VStack>
      )}
      <VStack align="stretch" gap={1}>
        <HStack>
          <Image h="20px" w="20px" src="/images/vot3-token.png" alt="vot3-token" />
          <Text color="#252525" fontWeight={600}>
            {compactFormatter.format(Number(data?.scaled || 0))}
          </Text>
        </HStack>
        <Text color="#6A6A6A" fontSize="12px">
          {t("Your VOT3 tokens")}
        </Text>
      </VStack>
    </HStack>
  )
}

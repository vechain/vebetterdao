import { ProposalState, useCurrentProposal, useVot3Balance } from "@/api"
import { HStack, Text, VStack } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)

export const ProposalSessionVot3 = () => {
  const { proposal } = useCurrentProposal()
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
            <UilArrowUpRight size="16px" color="#004CFC" />
          </HStack>
          <Text color="#6A6A6A" fontSize="12px">
            {t("Votes at snapshot")}
          </Text>
        </VStack>
      )}
      <VStack align="stretch" gap={0}>
        <Text color="#252525" fontWeight={600}>
          {`${compactFormatter.format(Number(data?.scaled || 0))} V3`}
        </Text>
        <Text color="#6A6A6A" fontSize="12px">
          {t("Your VOT3 tokens")}
        </Text>
      </VStack>
    </HStack>
  )
}

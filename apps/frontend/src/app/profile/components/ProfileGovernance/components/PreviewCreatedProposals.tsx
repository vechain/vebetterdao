import { HStack, VStack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { ProposalBox } from "."
import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"

type Props = {
  firstProposals?: ProposalEnriched[] | GrantProposalEnriched[]
  isLoading: boolean
  isMoreProposals?: boolean
  isCreatedProposals?: boolean
  onSeeAllProposals?: () => void
}

export const PreviewCreatedProposals = ({
  firstProposals,
  isLoading,
  isCreatedProposals,
  isMoreProposals,
  onSeeAllProposals,
}: Props) => {
  const { t } = useTranslation()

  if (!firstProposals || firstProposals.length == 0) return null

  return (
    <VStack w={"full"}>
      <HStack w={"full"} justifyContent={"space-between"} mb={{ base: 2, md: 4 }}>
        <Text fontSize={{ base: 18, md: 20 }} fontWeight={"bold"}>
          {isCreatedProposals ? t("Created Proposals") : t("Voted Proposals")}
        </Text>
        {isMoreProposals && (
          <HStack color={"#004CFC"} cursor={"pointer"} onClick={onSeeAllProposals}>
            <Text fontSize={{ base: 14, md: 16 }}>{t("See All")}</Text>
            <FiArrowUpRight size={16} />
          </HStack>
        )}
      </HStack>
      <VStack w={"full"} gap={4}>
        {firstProposals?.map(proposal => (
          <ProposalBox key={proposal.id} proposal={proposal} isLoading={isLoading} />
        ))}
      </VStack>
    </VStack>
  )
}

import { VStack, HStack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProposalCreatedEvent, ProposalMetadata } from "@/api"
import { useMemo } from "react"
import { toIPFSURL, validateIpfsUri } from "@/utils"
import { useIpfsMetadatas } from "@/api/ipfs"
import usePagination from "@/hooks/usePagination"
import { ProposalBox } from "./ProposalBox"
import { IoIosArrowBack } from "react-icons/io"

type PaginatedProposalsProps = {
  proposals: ProposalCreatedEvent[]
  itemsPerPage?: number
  goBack: () => void
}

export const PaginatedProposals = ({ proposals, itemsPerPage = 6, goBack }: PaginatedProposalsProps) => {
  const { t } = useTranslation()

  const { currentItems, hasMore, loadMore } = usePagination(proposals ?? [], itemsPerPage)

  const proposalsURIs = useMemo(() => {
    return currentItems
      .map(proposal => {
        const ipfsURL = toIPFSURL(proposal.description)
        if (validateIpfsUri(ipfsURL)) return ipfsURL
        return null
      })
      .filter(uri => uri !== null)
  }, [currentItems])

  const proposalsMetadata = useIpfsMetadatas<ProposalMetadata>(proposalsURIs as string[])

  const itemsWithMetadata = useMemo(() => {
    if (!currentItems || !proposalsMetadata) return null

    return currentItems.map((proposal, index) => ({
      ...proposal,
      metadata: proposalsMetadata[index]?.data,
    }))
  }, [currentItems, proposalsMetadata])

  return (
    <VStack w={"full"}>
      <HStack w={"full"} mb={{ base: 2, md: 4 }} color="#004CFC" cursor={"pointer"} onClick={goBack}>
        <IoIosArrowBack onClick={goBack} size={16} />
        <Text fontSize={{ base: 14, md: 16 }} fontWeight={"500"}>
          {t("go back")}
        </Text>
      </HStack>
      <VStack w={"full"} spacing={4}>
        {itemsWithMetadata?.map(proposal => (
          <ProposalBox key={proposal.proposalId} proposalId={proposal.proposalId} metadata={proposal.metadata} />
        ))}
      </VStack>
      {hasMore && (
        <Text onClick={loadMore} mt={4} color={"#004CFC"} cursor={"pointer"}>
          {t("Show More")}
        </Text>
      )}
    </VStack>
  )
}

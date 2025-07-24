import { VStack, HStack, Text, Spinner, Box } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProposalCreatedEvent, ProposalMetadata } from "@/api"
import { useMemo } from "react"
import { toIPFSURL, validateIpfsUri } from "@/utils"
import { useIpfsMetadatas } from "@/api/ipfs"
import { useInfiniteScroll, usePagination } from "@/hooks"
import { ProposalBox } from "./ProposalBox"
import { IoIosArrowBack } from "react-icons/io"

type PaginatedProposalsProps = {
  proposals: ProposalCreatedEvent[]
  itemsPerPage?: number
  goBack: () => void
}

export const PaginatedProposals = ({ proposals, itemsPerPage = 10, goBack }: PaginatedProposalsProps) => {
  const { t } = useTranslation()

  const { currentItems, hasMore, loadMore, loading } = usePagination(proposals ?? [], itemsPerPage)

  const proposalsURIs = useMemo(() => {
    return currentItems
      .map(proposal => {
        const ipfsURL = toIPFSURL(proposal.description)
        if (validateIpfsUri(ipfsURL)) return ipfsURL
        return null
      })
      .filter((uri): uri is string => uri !== null)
  }, [currentItems])

  const proposalsMetadata = useIpfsMetadatas<ProposalMetadata>(proposalsURIs as string[])

  const itemsWithMetadata = useMemo(() => {
    if (!currentItems || !proposalsMetadata) return null

    return currentItems.map((proposal, index) => ({
      ...proposal,
      metadata: proposalsMetadata[index]?.data,
    }))
  }, [currentItems, proposalsMetadata])

  useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore: loadMore,
  })

  return (
    <VStack w="full" gap={4}>
      {/* Back Button */}
      <HStack w="full" mb={{ base: 2, md: 4 }} color="#004CFC" cursor="pointer" onClick={goBack}>
        <IoIosArrowBack size={16} />
        <Text fontSize={{ base: 14, md: 16 }} fontWeight="500">
          {t("go back")}
        </Text>
      </HStack>

      {/* Proposals List */}
      <VStack w="full" gap={4}>
        {itemsWithMetadata?.map(proposal => (
          <ProposalBox key={proposal.proposalId} proposalId={proposal.proposalId} metadata={proposal.metadata} />
        ))}
      </VStack>

      {/* Sentinel Element */}
      {hasMore && (
        <Box id="infinite-scroll-sentinel" w="full" display="flex" justifyContent="center" mt={4}>
          {loading && <Spinner color="#004CFC" />}
        </Box>
      )}
    </VStack>
  )
}

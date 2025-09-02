import { VStack, Spinner, Box, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProposalMetadata } from "@/api"
import { useMemo } from "react"
import { toIPFSURL, validateIpfsUri } from "@/utils"
import { useIpfsMetadatas } from "@/api/ipfs"
import { useInfiniteScroll, usePagination } from "@/hooks"
import { ProposalBox } from "./ProposalBox"
import { FaAngleLeft } from "react-icons/fa"
import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"

type PaginatedProposalsProps = {
  proposals: ProposalEnriched[] | GrantProposalEnriched[]
  isLoading: boolean
  itemsPerPage?: number
  goBack: () => void
}

export const PaginatedProposals = ({ proposals, isLoading, itemsPerPage = 10, goBack }: PaginatedProposalsProps) => {
  const { t } = useTranslation()

  const { currentItems, hasMore, loadMore, loading } = usePagination(proposals ?? [], itemsPerPage)

  const proposalsURIs = useMemo(() => {
    return currentItems
      .map(proposal => {
        const ipfsURL = toIPFSURL(proposal.ipfsDescription)
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

      <Button variant={"plain"} color="primary" onClick={goBack} size="sm" alignItems="center" alignSelf={"flex-start"}>
        <FaAngleLeft />
        {t("Go back")}
      </Button>

      {/* Proposals List */}
      <VStack w="full" gap={4}>
        {itemsWithMetadata?.map(proposal => (
          <ProposalBox key={proposal.id} proposal={proposal} isLoading={isLoading} metadata={proposal.metadata} />
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

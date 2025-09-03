import { VStack, Spinner, Box, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
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
        {currentItems?.map(proposal => (
          <ProposalBox key={proposal.id} proposal={proposal} isLoading={isLoading} />
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

import { VStack, Spinner, Box, Button, Card } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaAngleLeft } from "react-icons/fa"

import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"

import { useInfiniteScroll } from "../../../../../hooks/useInfiniteScroll"
import { usePagination } from "../../../../../hooks/usePagination"

import { ProposalBox } from "./ProposalBox"

type PaginatedProposalsProps = {
  proposals: ProposalEnriched[] | GrantProposalEnriched[]
  itemsPerPage?: number
  goBack: () => void
}
export const PaginatedProposals = ({ proposals, itemsPerPage = 10, goBack }: PaginatedProposalsProps) => {
  const { t } = useTranslation()
  const { currentItems, hasMore, loadMore, loading } = usePagination(proposals ?? [], itemsPerPage)
  useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore: loadMore,
  })
  return (
    <Card.Root w="full" variant="primary">
      <Card.Body gap={4}>
        <Button
          variant={"plain"}
          color="actions.tertiary.default"
          onClick={goBack}
          size="sm"
          alignItems="center"
          alignSelf={"flex-start"}>
          <FaAngleLeft />
          {t("Go back")}
        </Button>
        {/* Proposals List */}
        <VStack w="full" gap={4}>
          {currentItems?.map(proposal => (
            <ProposalBox
              key={proposal.id}
              proposalId={proposal.id}
              metadata={{
                title: proposal.title,
                shortDescription: proposal.description,
                markdownDescription: proposal.markdownDescription,
              }}
            />
          ))}
        </VStack>

        {/* Sentinel Element */}
        {hasMore && (
          <Box id="infinite-scroll-sentinel" w="full" display="flex" justifyContent="center" mt={4}>
            {loading && <Spinner color="#004CFC" />}
          </Box>
        )}
      </Card.Body>
    </Card.Root>
  )
}

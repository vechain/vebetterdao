import { VStack, Box, Spinner, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaAngleLeft } from "react-icons/fa"

import { AppVotesGiven } from "../../../../../api/contracts/xApps/hooks/useUserTopVotedApps"
import { useInfiniteScroll } from "../../../../../hooks/useInfiniteScroll"
import { usePagination } from "../../../../../hooks/usePagination"

import { AppVotedBox } from "./AppVotedBox"

type PaginatedProposalsProps = {
  topVotedApps: AppVotesGiven[]
  itemsPerPage?: number
  goBack: () => void
}
export const PaginatedTopVotedApps = ({ topVotedApps, itemsPerPage = 6, goBack }: PaginatedProposalsProps) => {
  const { t } = useTranslation()
  //TODO: refactor and align  with useInfiniteQuery
  const { currentItems, hasMore, loadMore, loading } = usePagination(topVotedApps ?? [], itemsPerPage)
  //TODO: refactor  and align with useInfiniteQuery
  useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore: loadMore,
  })
  return (
    <VStack w={"full"}>
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
      <VStack w={"full"} gap={4}>
        {currentItems?.map(app => (
          <AppVotedBox key={app.appId} appVoted={app} />
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

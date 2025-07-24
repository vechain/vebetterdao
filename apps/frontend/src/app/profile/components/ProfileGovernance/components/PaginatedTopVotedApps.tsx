import { VStack, HStack, Text, Box, Spinner } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { AppVotesGiven } from "@/api"
import { usePagination, useInfiniteScroll } from "@/hooks"
import { IoIosArrowBack } from "react-icons/io"
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
      <HStack w={"full"} mb={{ base: 2, md: 4 }} color="#004CFC" cursor={"pointer"} onClick={goBack}>
        <IoIosArrowBack onClick={goBack} size={16} />
        <Text fontSize={{ base: 14, md: 16 }} fontWeight={"500"}>
          {t("go back")}
        </Text>
      </HStack>
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

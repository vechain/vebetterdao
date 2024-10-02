import { VStack, HStack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { AppVotesGiven } from "@/api"
import usePagination from "@/hooks/usePagination"
import { IoIosArrowBack } from "react-icons/io"
import { AppVotedBox } from "./AppVotedBox"

type PaginatedProposalsProps = {
  topVotedApps: AppVotesGiven[]
  itemsPerPage?: number
  goBack: () => void
}

export const PaginatedTopVotedApps = ({ topVotedApps, itemsPerPage = 6, goBack }: PaginatedProposalsProps) => {
  const { t } = useTranslation()

  const { currentItems, hasMore, loadMore } = usePagination(topVotedApps ?? [], itemsPerPage)

  return (
    <VStack w={"full"}>
      <HStack w={"full"} mb={{ base: 2, md: 4 }} color="#004CFC" cursor={"pointer"} onClick={goBack}>
        <IoIosArrowBack onClick={goBack} size={16} />
        <Text fontSize={{ base: 14, md: 16 }} fontWeight={"500"}>
          {t("go back")}
        </Text>
      </HStack>
      <VStack w={"full"} spacing={4}>
        {currentItems?.map(app => <AppVotedBox key={app.appId} appVoted={app} />)}
      </VStack>
      {hasMore && (
        <Text onClick={loadMore} mt={4} color={"#004CFC"} cursor={"pointer"}>
          {t("Show More")}
        </Text>
      )}
    </VStack>
  )
}

import { Button, Card, CardBody, Heading, HStack, Skeleton, Stack, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import InfiniteScroll from "react-infinite-scroll-component"
import { useGetTokensInfoByOwner } from "@/api/contracts/galaxyMember/hooks/useGetTokensInfoByOwner"
import { useWallet } from "@vechain/dapp-kit-react"
import { GMNFTListItem } from "./GMNFTListItem"
import { useMemo } from "react"

export const GMNFTList = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const pageSize = 10
  const {
    data: tokensInfo,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useGetTokensInfoByOwner(account, pageSize)

  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const loadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }

  const tokens = useMemo(() => {
    return tokensInfo?.pages.map(page => page.data).flat()
  }, [tokensInfo])

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="lg">{t("My Galaxy NFTs")}</Heading>
              <UilInfoCircle color="#004CFC" />
            </HStack>
            <Text fontSize="sm">
              {t(
                "You can choose which NFT use for rewards multiplier. Also you can min new earth to upgrade and sell them in the secondary market.",
              )}
            </Text>
          </VStack>
          <VStack align="stretch" gap={6}>
            <InfiniteScroll
              dataLength={tokens?.length || 0}
              next={loadMore}
              hasMore={hasNextPage || false}
              loader={<Skeleton height="100px" />}>
              {tokens?.map((token, index) => <GMNFTListItem key={index} token={token} />)}
            </InfiniteScroll>
            <Card
              rounded="8px"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%23004CFC' stroke-width='1' stroke-dasharray='12%2c 15' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
              }}>
              <CardBody bg={"#EBF1FE"} rounded="8px">
                <Stack
                  direction={isAbove800 ? "row" : "column"}
                  justify={isAbove800 ? "space-between" : "flex-start"}
                  align="stretch"
                  gap={4}>
                  <VStack align="stretch" gap={1}>
                    <Heading fontSize="lg">{t("Mint a GM Earth NFT")}</Heading>
                    <Text fontSize="sm" color="#6A6A6A">
                      {t("To upgrade and sell in the secondary market")}
                    </Text>
                  </VStack>
                  <Button variant="primaryAction">{t("Mint a GM Earth NFT")}</Button>
                </Stack>
              </CardBody>
            </Card>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

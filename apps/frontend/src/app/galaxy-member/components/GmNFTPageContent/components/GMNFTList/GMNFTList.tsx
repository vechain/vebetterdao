import { Button, Card, Heading, HStack, Skeleton, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { UilInfoCircle, UilLinkBroken } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import InfiniteScroll from "react-infinite-scroll-component"
import { useGetTokensInfoByOwner } from "@/api/contracts/galaxyMember/hooks/useGetTokensInfoByOwner"
import { useWallet } from "@vechain/vechain-kit"
import { GMNFTListItem } from "./GMNFTListItem"
import { useMemo } from "react"
import { FeatureFlagWrapper, BaseTooltip } from "@/components"
import { FeatureFlag } from "@/constants"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"
import { useIsXNodeAttachedWhileTransferred } from "@/hooks"

export const GMNFTList = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const {
    data: tokensInfo,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useGetTokensInfoByOwner(account?.address ?? "")
  const { isXNodeAttachedWhileTransferred } = useIsXNodeAttachedWhileTransferred()

  const loadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }

  const tokens = useMemo(() => {
    return tokensInfo?.pages.map(page => page.data).flat()
  }, [tokensInfo])

  const detachGmToXNodeModal = useDisclosure()
  const handleDetachOnClick = () => {
    detachGmToXNodeModal.onOpen()
  }

  return (
    <>
      <Card.Root variant="baseWithBorder" w="full">
        <Card.Body>
          <VStack align="stretch" gap={6}>
            <VStack align="stretch">
              <HStack justify="space-between">
                <Heading fontSize="lg">{t("My Galaxy NFTs")}</Heading>

                <BaseTooltip text={t("The active NFT is selected for rewards multiplier.")}>
                  <span>
                    <UilInfoCircle color="#004CFC" />
                  </span>
                </BaseTooltip>
              </HStack>
              <FeatureFlagWrapper
                feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
                fallback={
                  <Text fontSize="sm">
                    {t(
                      "Here is a list of your GM NFTs. Soon you will be able to mint new ones, upgrade and sell them in the secondary market.",
                    )}
                  </Text>
                }>
                <Text fontSize="sm">{t("You can choose which NFT use for rewards multiplier.")}</Text>
              </FeatureFlagWrapper>
            </VStack>
            <VStack align="stretch" gap={4}>
              <InfiniteScroll
                dataLength={tokens?.length || 0}
                next={loadMore}
                hasMore={hasNextPage || false}
                loader={<Skeleton height="100px" />}>
                <VStack align="stretch" gap={4} p={[0, 3]}>
                  {tokens?.map(token => (
                    <GMNFTListItem key={token.tokenId} token={token} />
                  ))}
                </VStack>
              </InfiniteScroll>
            </VStack>
            {isXNodeAttachedWhileTransferred && (
              <Button
                leftIcon={<UilLinkBroken color="#C84968" />}
                color="#C84968"
                variant={"link"}
                onClick={() => handleDetachOnClick()}>
                {t("Detach")}
              </Button>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>
      <DetachGMToXNodeModal isOpen={detachGmToXNodeModal.isOpen} onClose={detachGmToXNodeModal.onClose} />
    </>
  )
}

import {
  Card,
  Flex,
  HStack,
  Icon,
  Image,
  LinkBox,
  LinkOverlay,
  Separator,
  SimpleGrid,
  Skeleton,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import NextLink from "next/link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCoins, LuUsers, LuWallet, LuZap } from "react-icons/lu"

import { useAppEndorsementStatus } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useAppActionOverview } from "@/api/indexer/actions/useAppActionOverview"
import { useAppEarnings } from "@/api/indexer/xallocations/useAppEarnings"
import NewAppIcon from "@/components/Icons/svg/new-app.svg"
import { XAppStatus } from "@/types/appDetails"

import { useXAppMetadata } from "../../../api/contracts/xApps/hooks/useXAppMetadata"
import { useIpfsImage } from "../../../api/ipfs/hooks/useIpfsImage"
import { EndorsementStatusCallout } from "../[appId]/components/AppEndorsementInfoCard/EndorsementStatusCallout"
const notFoundImage = "/assets/images/image-not-found.webp"
const compact = getCompactFormatter(1)

type Props = {
  appId: string
  isNewApp: boolean
  showStats?: boolean
}
export const UnendorsedAppCard = ({ appId, isNewApp, showStats = true }: Props) => {
  const { t } = useTranslation()
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(appId)
  const { data: logo } = useIpfsImage(appMetadata?.logo)
  const { data: appOverview, isLoading: isOverviewLoading } = useAppActionOverview(appId, undefined, showStats)
  const { data: earningsData, isLoading: isEarningsLoading } = useAppEarnings(appId, undefined, { enabled: showStats })
  const { status: endorsementStatus, isLoading: isEndorsementStatusLoading } = useAppEndorsementStatus(appId)

  const totalB3trReceived = useMemo(() => {
    if (!earningsData || !Array.isArray(earningsData)) return 0
    return earningsData.reduce((sum, earning) => sum + (earning.totalAmount || 0), 0)
  }, [earningsData])

  const showEndorsementStatus =
    endorsementStatus !== XAppStatus.UNKNOWN && endorsementStatus !== XAppStatus.ENDORSED_AND_ELIGIBLE

  return (
    <LinkBox asChild>
      <LinkOverlay asChild>
        <NextLink href={`/apps/${appId}`}>
          <Card.Root variant="subtle" w="full" maxW="full" minW={0} overflow="hidden">
            <Card.Body>
              <VStack align="stretch" gap={3} w="full">
                <HStack gap={3} w="full" align="center">
                  <Image
                    src={logo?.image ?? notFoundImage}
                    alt={appMetadata?.name ?? ""}
                    w="11"
                    h="11"
                    rounded="lg"
                    objectFit="contain"
                    flexShrink={0}
                  />
                  <Flex
                    direction="row"
                    align="center"
                    justify="space-between"
                    gap={2}
                    flex={1}
                    minW={0}
                    flexWrap="wrap">
                    <HStack gap={2} minW={0}>
                      <Skeleton loading={appMetadataLoading} minW={0}>
                        <Text textStyle="md" fontWeight="semibold">
                          {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                        </Text>
                      </Skeleton>
                      {isNewApp && (
                        <Tag.Root size="sm" variant="solid" colorPalette="green" fontWeight="semibold" flexShrink={0}>
                          <Tag.StartElement>
                            <Icon color="info.default" boxSize={3}>
                              <NewAppIcon />
                            </Icon>
                          </Tag.StartElement>
                          <Tag.Label>{t("New!")}</Tag.Label>
                        </Tag.Root>
                      )}
                    </HStack>
                    {showEndorsementStatus && (
                      <Skeleton loading={isEndorsementStatusLoading} flexShrink={0}>
                        <EndorsementStatusCallout
                          endorsementStatus={endorsementStatus}
                          appId={appId}
                          showDescription={false}
                          padding={1}
                          boxSize={4}
                          textStyle="sm"
                          flex="initial"
                        />
                      </Skeleton>
                    )}
                  </Flex>
                </HStack>

                <Skeleton loading={appMetadataLoading}>
                  <Text textStyle="sm" color="text.subtle" lineClamp={4} w="full" minW={0}>
                    {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
                  </Text>
                </Skeleton>

                <Separator />
                {showStats && (
                  <SimpleGrid columns={{ base: 2, md: 4 }} gap={2} w="full">
                    <Skeleton loading={isEarningsLoading}>
                      <HStack gap={2} align="center">
                        <Icon as={LuWallet} boxSize={4} color="text.subtle" flexShrink={0} />
                        <Text textStyle="sm" color="text.subtle" lineClamp={1}>
                          {compact.format(totalB3trReceived)} {"B3TR"}
                        </Text>
                      </HStack>
                    </Skeleton>
                    <Skeleton loading={isOverviewLoading}>
                      <HStack gap={2} align="center">
                        <Icon as={LuCoins} boxSize={4} color="text.subtle" flexShrink={0} />
                        <Text textStyle="sm" color="text.subtle" lineClamp={1}>
                          {compact.format(appOverview?.totalRewardAmount ?? 0)} {"distributed"}
                        </Text>
                      </HStack>
                    </Skeleton>
                    <Skeleton loading={isOverviewLoading}>
                      <HStack gap={2} align="center">
                        <Icon as={LuZap} boxSize={4} color="text.subtle" flexShrink={0} />
                        <Text textStyle="sm" color="text.subtle" lineClamp={1}>
                          {compact.format(appOverview?.actionsRewarded ?? 0)} {"actions"}
                        </Text>
                      </HStack>
                    </Skeleton>
                    <Skeleton loading={isOverviewLoading}>
                      <HStack gap={2} align="center">
                        <Icon as={LuUsers} boxSize={4} color="text.subtle" flexShrink={0} />
                        <Text textStyle="sm" color="text.subtle" lineClamp={1}>
                          {compact.format(appOverview?.totalUniqueUserInteractions ?? 0)} {"users"}
                        </Text>
                      </HStack>
                    </Skeleton>
                  </SimpleGrid>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        </NextLink>
      </LinkOverlay>
    </LinkBox>
  )
}

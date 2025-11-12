import {
  Card,
  Separator,
  Heading,
  HStack,
  Skeleton,
  Stack,
  Text,
  VStack,
  Icon,
  Avatar,
  Tag,
  LinkBox,
  LinkOverlay,
} from "@chakra-ui/react"
import { UilAngleRight } from "@iconscout/react-unicons"
import NextLink from "next/link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import NewAppIcon from "@/components/Icons/svg/new-app.svg"

import { useAppEndorsementStatus } from "../../../api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useXAppMetadata } from "../../../api/contracts/xApps/hooks/useXAppMetadata"
import { useGetUserNodes } from "../../../api/contracts/xNodes/useGetUserNodes"
import { useIpfsImage } from "../../../api/ipfs/hooks/useIpfsImage"
const notFoundImage = "/assets/images/image-not-found.webp"
import { useXAppStatusConfig } from "../[appId]/hooks/useXAppStatusConfig"

type Props = {
  appId: string
  isNewApp: boolean
  layout?: "endorser" | "default"
}
export const UnendorsedAppCard = ({ appId, isNewApp, layout = "default" }: Props) => {
  const { t } = useTranslation()
  const { data: userNodes, isLoading: isUserNodesLoading } = useGetUserNodes(appId)
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(appId)
  const { data: logo } = useIpfsImage(appMetadata?.logo)
  // TODO: Fetch endorsedAppId from nodeToEndorsedApp contract call
  const nodeEndorsingApp = userNodes?.nodes?.find((node: any) => false) // TODO: Placeholder until endorsedAppId is fetched
  const {
    score: endorsementScore,
    threshold: endorsementThreshold,
    status: endorsementStatus,
    isLoading: isEndorsementStatusLoading,
  } = useAppEndorsementStatus(appId)
  const STATUS_CONFIG = useXAppStatusConfig()
  const { color } = STATUS_CONFIG[endorsementStatus as keyof typeof STATUS_CONFIG] ?? { color: "#6A6A6A" }

  const isUserAppEndorser = useMemo(() => {
    if (!appId) return false
    // TODO: Determine isXNodeHolder status
    return false // TODO: Placeholder
  }, [appId, nodeEndorsingApp])

  return (
    <LinkBox asChild>
      <LinkOverlay asChild>
        <NextLink href={`/apps/${appId}`}>
          <Card.Root variant="subtle" w="full" maxW="full">
            <Card.Body>
              <Stack
                direction={layout === "endorser" ? "column" : { base: "column", lg: "row" }}
                align="stretch"
                w="full"
                h="full">
                <Stack direction="row" gap={4} align="center" flex="1">
                  <Avatar.Root shape="rounded" boxSize="3.5rem" borderRadius="0.75rem">
                    <Avatar.Image
                      src={logo?.image ?? notFoundImage}
                      alt="logo"
                      borderRadius="0.75rem"
                      objectFit="contain"
                    />
                    <Avatar.Fallback name={appMetadata?.name} />
                  </Avatar.Root>

                  <Stack flex="1" gap={0} align="stretch" justify="center" overflow="hidden">
                    <Skeleton loading={appMetadataLoading}>
                      <HStack gap={4} align="center">
                        <Heading
                          size="xl"
                          lineClamp={1}
                          maxW={{ base: "full", md: "150px", lg: "200px" }}
                          overflow="hidden"
                          textOverflow="ellipsis">
                          {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                        </Heading>
                        {isNewApp && (
                          <Tag.Root size="sm" variant="solid" colorPalette="green" fontWeight="semibold">
                            <Tag.StartElement>
                              <Icon color="info.default" boxSize={3}>
                                <NewAppIcon />
                              </Icon>
                            </Tag.StartElement>
                            <Tag.Label>{t("New!")}</Tag.Label>
                          </Tag.Root>
                        )}
                      </HStack>
                    </Skeleton>
                    <Skeleton loading={appMetadataLoading}>
                      <Text textStyle="sm" color="text.subtle" overflow="hidden" textOverflow="ellipsis" lineClamp={2}>
                        {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
                      </Text>
                    </Skeleton>
                  </Stack>
                </Stack>

                <Separator orientation="vertical" h="100%" size="sm" px={2} borderColor="border.emphasized" />
                <Separator orientation="horizontal" h="100%" size="sm" borderColor="border.emphasized" />

                <Stack direction="row" align="center" justify="center">
                  <Stack
                    direction={layout === "endorser" ? "row" : { base: "row", lg: "column", md: "column" }}
                    gap={3}
                    align={{ base: "center", lg: "stretch", md: "stretch" }}
                    justify={{ base: "space-between", md: "stretch" }}
                    w="full">
                    <VStack gap={0} alignItems="flex-start">
                      <Skeleton loading={isEndorsementStatusLoading}>
                        <HStack gap={1} align="flex-end">
                          <Text textStyle="2xl" lineHeight={1} color={color}>
                            {endorsementScore}
                          </Text>
                          <Text textStyle="sm" lineHeight={1} color={color}>{`/${endorsementThreshold}`}</Text>
                        </HStack>
                      </Skeleton>
                      <Text textStyle="xs" color="text.subtle">
                        {t("Total score")}
                      </Text>
                    </VStack>

                    {isUserAppEndorser && (
                      <VStack gap={0} alignItems="flex-start">
                        <Skeleton loading={isUserNodesLoading}>
                          <Text textStyle="2xl" color="#004CFC">
                            {nodeEndorsingApp?.endorsementScore?.toString()}
                          </Text>
                        </Skeleton>
                        <Text textStyle="xs" color="text.subtle">
                          {t("Your score")}
                        </Text>
                      </VStack>
                    )}
                  </Stack>
                  <Icon hideBelow="md" as={UilAngleRight} boxSize={"32px"} color="icon.default" alignSelf={"center"} />
                </Stack>
              </Stack>
            </Card.Body>
          </Card.Root>
        </NextLink>
      </LinkOverlay>
    </LinkBox>
  )
}

import { Card, Separator, Heading, HStack, Image, Skeleton, Stack, Text, VStack, Icon } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { UilAngleRight } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useAppEndorsementStatus, useGetUserNodes, useIpfsImage, useXAppMetadata } from "@/api"
import { notFoundImage } from "@/constants"
import { useXAppStatusConfig } from "../[appId]/hooks"

type Props = {
  appId: string
  isNewApp: boolean
  layout?: "endorser" | "default"
}

export const UnendorsedAppCard = ({ appId, isNewApp, layout = "default" }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()

  const { data: userNodes, isLoading: isUserNodesLoading } = useGetUserNodes(appId)
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(appId)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)
  const nodeEndorsingApp = userNodes?.allNodes?.find(node => node.endorsedAppId === appId)

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
    return nodeEndorsingApp?.isXNodeHolder
  }, [appId, nodeEndorsingApp])

  const onCardClick = useCallback(() => {
    router.push(`/apps/${appId}`)
  }, [router, appId])

  return (
    <Card.Root
      variant={"baseWithBorder"}
      w="full"
      onClick={onCardClick}
      maxW="100%"
      _hover={{
        cursor: "pointer",
        backgroundColor: "hover-contrast-bg",
        transition: "all 0.3s",
      }}>
      <Card.Body py="16px" px="24px">
        <Stack
          direction={layout === "endorser" ? "column" : { base: "column", lg: "row" }}
          align="stretch"
          w="full"
          h="full">
          <Stack direction="row" gap={4} align="center" flex="1">
            <Skeleton loading={isLogoLoading}>
              <Image
                src={logo?.image ?? notFoundImage}
                alt="logo"
                h="72px"
                w="72px"
                minW="72px"
                borderRadius="9px"
                objectFit="contain"
              />
            </Skeleton>

            <Stack flex="1" align="stretch" justify="center">
              <Skeleton loading={appMetadataLoading}>
                <HStack gap={4} align="center">
                  <Heading
                    fontWeight={700}
                    fontSize="20px"
                    lineClamp={1}
                    maxW={{ base: "full", md: "150px", lg: "200px" }}
                    overflow="hidden"
                    textOverflow="ellipsis">
                    {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                  </Heading>
                  {isNewApp && (
                    <HStack
                      fontWeight={700}
                      color={"#3B3B3B"}
                      bg={"#B1F16C"}
                      px={2}
                      py={1}
                      borderRadius={"16px"}
                      fontSize="12px"
                      gap={1}
                      flexShrink={0}>
                      <Image src="/assets/icons/new-app-gray.svg" alt="new" boxSize={3} mr={1} />
                      <Text>{t("New!")}</Text>
                    </HStack>
                  )}
                </HStack>
              </Skeleton>
              <Skeleton loading={appMetadataLoading}>
                <Text fontSize="14px" color="#6A6A6A" fontWeight={400} lineClamp={2}>
                  {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
                </Text>
              </Skeleton>
            </Stack>
          </Stack>

          <Separator hideBelow="md" orientation="vertical" h="100%" />
          <Separator hideFrom="md" orientation="horizontal" h="100%" />

          {/* Right Section: Score */}
          <Stack direction="row" align="center" justify="center">
            <Stack
              direction={layout === "endorser" ? "row" : { base: "row", lg: "column", md: "column" }}
              gap={3}
              align={{ base: "center", lg: "stretch", md: "stretch" }}
              justify={{ base: "space-between", md: "stretch" }}
              w="full">
              <VStack gap={0} alignItems="flex-start">
                <Skeleton loading={isEndorsementStatusLoading}>
                  <HStack gap={1}>
                    <Text fontSize="24px" fontWeight="700" color={color}>
                      {endorsementScore}
                    </Text>
                    <Text fontSize="14px" color={color} pb="3.5px">{`/${endorsementThreshold}`}</Text>
                  </HStack>
                </Skeleton>
                <Text fontSize="12px" color="#6A6A6A">
                  {t("Total score")}
                </Text>
              </VStack>

              {isUserAppEndorser && (
                <VStack gap={0} alignItems="flex-start">
                  <Skeleton loading={isUserNodesLoading}>
                    <Text fontSize="24px" fontWeight="700" color="#004CFC">
                      {nodeEndorsingApp?.xNodePoints}
                    </Text>
                  </Skeleton>
                  <Text fontSize="12px" color="#6A6A6A">
                    {t("Your score")}
                  </Text>
                </VStack>
              )}
            </Stack>
            <Icon hideBelow="md" as={UilAngleRight} boxSize={"32px"} color={"#004CFC"} alignSelf={"center"} />
          </Stack>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}

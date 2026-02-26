const notFoundImage = "/assets/images/image-not-found.webp"
import { Button, Card, Flex, HStack, Heading, Image, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { UilExternalLinkAlt } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAppEarnings } from "@/api/indexer/xallocations/useAppEarnings"

import { XAppStatus } from "../../../../../types/appDetails"
import { useCurrentAppBanner } from "../../hooks/useCurrentAppBanner"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { useCurrentAppLogo } from "../../hooks/useCurrentAppLogo"
import { useCurrentAppMetadata } from "../../hooks/useCurrentAppMetadata"
import { EndorsementStatusCallout } from "../AppEndorsementInfoCard/EndorsementStatusCallout"

import { AdminAppPageButton } from "./components/AdminAppPageButton"
import { AppDetailSocials } from "./components/AppDetailSocials"
import { EditAppPageButton } from "./components/EditAppPageButton"

export const AppDetailOverview = ({
  endorsementStatus,
  isEndorsementStatusLoading,
}: {
  endorsementStatus: XAppStatus
  isEndorsementStatusLoading: boolean
}) => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { appMetadata, appMetadataLoading, appMetadataError } = useCurrentAppMetadata()
  const { logo, isLogoLoading } = useCurrentAppLogo()
  const { banner, isBannerLoading } = useCurrentAppBanner()
  const { data: earningsData } = useAppEarnings(app?.id ?? "")
  const firstRoundId = useMemo(() => {
    if (!earningsData || !Array.isArray(earningsData) || earningsData.length === 0) return undefined
    return Math.min(...earningsData.map(e => e.roundId))
  }, [earningsData])

  const goToWebsite = useCallback(() => {
    if (appMetadata?.external_url) {
      window.open(appMetadata.external_url, "_blank")
    }
  }, [appMetadata?.external_url])

  return (
    <>
      <VStack gap={4} align="stretch">
        <Card.Root variant="primary">
          <Card.Body>
            <VStack align="stretch" gap={4}>
              <Skeleton loading={isBannerLoading}>
                <Image
                  src={banner ?? notFoundImage}
                  alt={"banner"}
                  borderRadius="24px"
                  w={"full"}
                  objectFit={"cover"}
                  objectPosition="center"
                  h={{ base: "180px", md: "220px" }}
                />
              </Skeleton>
              <Flex gap="48px" flexDir={["column", "column", "row"]} w="full">
                <VStack alignItems={"stretch"} flex={3} justify={"space-between"} gap={8} w="full">
                  <HStack justify={"space-between"} flexWrap={"wrap"}>
                    <Stack
                      direction={["column", "column", "row"]}
                      justify={["stretch", "stretch", "space-between"]}
                      w="full"
                      align={["stretch", "stretch", "center"]}
                      gap={[4, 4, 0]}>
                      <HStack gap={4}>
                        <Skeleton loading={isLogoLoading} alignContent={"start"}>
                          <Image src={logo ?? notFoundImage} alt={"logo"} boxSize={"64px"} borderRadius="16px" />
                        </Skeleton>
                        <Skeleton loading={appMetadataLoading && !!appMetadata}>
                          <Heading size="3xl">
                            {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                          </Heading>
                        </Skeleton>
                        <HStack gap={2}>
                          <EditAppPageButton />
                          <AdminAppPageButton />
                        </HStack>
                      </HStack>
                      <Skeleton loading={isEndorsementStatusLoading} alignSelf={["flex-start", "flex-start", "center"]}>
                        <EndorsementStatusCallout
                          endorsementStatus={endorsementStatus}
                          showDescription={false}
                          padding={2}></EndorsementStatusCallout>
                      </Skeleton>
                    </Stack>
                    <AppDetailSocials socialUrls={appMetadata?.social_urls || []} />
                  </HStack>
                  <Skeleton loading={appMetadataLoading || !appMetadata}>
                    <Text textStyle={"md"}>
                      {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
                    </Text>
                  </Skeleton>
                  <Stack
                    flexDirection={["column", "column", "row"]}
                    justify={"space-between"}
                    align={"center"}
                    w="full">
                    <Stack
                      direction={["column", "column", "row"]}
                      gap={[4, 4, 10]}
                      w={{ base: "full", md: "auto" }}
                      justifyContent={{ base: "space-between", md: "flex-start" }}>
                      {app?.createdAtTimestamp && app.createdAtTimestamp !== "0" && (
                        <VStack align="stretch">
                          <Text textStyle={"sm"} color="text.subtle">
                            {t("Member since")}
                          </Text>
                          <HStack>
                            <Text textStyle={"md"}>
                              {dayjs((Number(app?.createdAtTimestamp) || 0) * 1000).format("D MMM, YYYY")}
                            </Text>
                            {firstRoundId != null && (
                              <Text textStyle={"md"}>
                                {"("}
                                {t("Round #{{round}}", { round: firstRoundId.toString() })}
                                {")"}
                              </Text>
                            )}
                          </HStack>
                        </VStack>
                      )}
                    </Stack>
                    <Button
                      variant={"primary"}
                      onClick={goToWebsite}
                      w={{ base: "full", md: "auto" }}
                      mt={{ base: 4, md: 0 }}>
                      {t("Go to Website")}
                      <UilExternalLinkAlt color="white" size={"16px"} />
                    </Button>
                  </Stack>
                </VStack>
              </Flex>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </>
  )
}

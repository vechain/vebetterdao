import { notFoundImage } from "@/constants"
import { XAppStatus } from "@/types"
import {
  Button,
  Card,
  Separator,
  Flex,
  HStack,
  Heading,
  Image,
  Skeleton,
  Stack,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useCurrentAppBanner, useCurrentAppLogo, useCurrentAppMetadata } from "../../hooks"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { AdminAppPageButton } from "./components/AdminAppPageButton"
import { AppDetailAllocationInfo } from "./components/AppDetailAllocationInfo"
import { AppDetailSocials } from "./components/AppDetailSocials"
import { AppReceiverAddress } from "./components/AppReceiverAddress"
import { EditAppPageButton } from "./components/EditAppPageButton"
import { EndorsementStatusCallout } from "../AppEndorsementInfoCard/EndorsementStatusCallout"
import { DistributionStrategyModal } from "./components/DistributionStrategyModal"
import { useBreakpoints } from "@/hooks"

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
  const {
    open: isDistributionStrategyModalOpen,
    onOpen: onDistributionStrategyModalOpen,
    onClose: onDistributionStrategyModalClose,
  } = useDisclosure()
  const { isMobile } = useBreakpoints()

  const goToWebsite = useCallback(() => {
    if (appMetadata?.external_url) {
      window.open(appMetadata.external_url, "_blank")
    }
  }, [appMetadata?.external_url])

  const showEndorsementStatusCallout = useMemo(() => {
    return endorsementStatus !== XAppStatus.ENDORSED_AND_ELIGIBLE && endorsementStatus !== XAppStatus.BLACKLISTED
  }, [endorsementStatus])

  return (
    <>
      <VStack gap={4} align="stretch">
        {showEndorsementStatusCallout && <EndorsementStatusCallout endorsementStatus={endorsementStatus} />}
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
                      <AppReceiverAddress />

                      <Separator hideFrom="md" />

                      {app?.createdAtTimestamp && app.createdAtTimestamp !== "0" && (
                        <VStack align="stretch">
                          <Text textStyle={"sm"} color="text.subtle">
                            {t("Member since")}
                          </Text>
                          <Text textStyle={"md"}>
                            {dayjs((Number(app?.createdAtTimestamp) || 0) * 1000).format("D MMM, YYYY")}
                          </Text>
                        </VStack>
                      )}
                      {appMetadata?.distribution_strategy ? (
                        <VStack align="flex-start" justify={"flex-start"}>
                          <Text textStyle={"sm"} color="text.subtle">
                            {t("Distribution Strategy")}
                          </Text>
                          <Button
                            w="auto"
                            h="auto"
                            p={0}
                            m={0}
                            variant={"ghost"}
                            color="text.subtle"
                            onClick={() => {
                              onDistributionStrategyModalOpen()
                            }}>
                            {t("View Details")}
                            <UilArrowUpRight />
                          </Button>
                        </VStack>
                      ) : null}
                    </Stack>
                    <HStack
                      justifyContent={{ base: "space-between", md: "flex-end" }}
                      w={{ base: "full", md: "auto" }}
                      mt={{ base: 4, md: 0 }}>
                      {!isMobile && (
                        <>
                          <EditAppPageButton />
                          <AdminAppPageButton />
                        </>
                      )}
                      <Button flex={1} variant={"primary"} onClick={goToWebsite}>
                        {t("Go to Website")}
                        <UilArrowUpRight color="white" size={"16px"} />
                      </Button>
                      {isMobile && (
                        <>
                          <EditAppPageButton />
                          <AdminAppPageButton />
                        </>
                      )}
                    </HStack>
                  </Stack>
                </VStack>
                <AppDetailAllocationInfo />
              </Flex>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
      <DistributionStrategyModal
        isOpen={isDistributionStrategyModalOpen}
        onClose={onDistributionStrategyModalClose}
        // TODO: migration add distribution_strategy to XAppMetadata in vechain-kit
        distributionStrategy={appMetadata?.distribution_strategy ?? ""}
        logo={logo ?? notFoundImage}
      />
    </>
  )
}

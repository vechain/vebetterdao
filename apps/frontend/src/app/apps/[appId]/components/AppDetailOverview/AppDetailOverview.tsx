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
  Show,
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
        <Card.Root variant="baseWithBorder">
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
                          <Heading fontSize={"28px"} fontWeight={700}>
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
                    <Text fontSize={"md"}>
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
                      <Show below="md">
                        <Separator />
                      </Show>
                      {app?.createdAtTimestamp && app.createdAtTimestamp !== "0" && (
                        <VStack align="stretch">
                          <Text fontSize={"14px"} fontWeight={400} color="#6A6A6A">
                            {t("Member since")}
                          </Text>
                          <Text fontSize={"16px"} fontWeight={400}>
                            {dayjs((Number(app?.createdAtTimestamp) || 0) * 1000).format("D MMM, YYYY")}
                          </Text>
                        </VStack>
                      )}
                      {appMetadata?.distribution_strategy ? (
                        <VStack align="flex-start" justify={"flex-start"}>
                          <Text fontSize={"14px"} fontWeight={400} color="#6A6A6A">
                            {t("Distribution Strategy")}
                          </Text>
                          <Button
                            w="auto"
                            h="auto"
                            p={0}
                            m={0}
                            variant={"link"}
                            color="#6A6A6A"
                            rightIcon={<UilArrowUpRight />}
                            onClick={() => {
                              onDistributionStrategyModalOpen()
                            }}>
                            {t("View Details")}
                          </Button>
                        </VStack>
                      ) : null}
                    </Stack>
                    <HStack
                      justifyContent={{ base: "space-between", md: "flex-end" }}
                      w={{ base: "full", md: "auto" }}
                      mt={{ base: 4, md: 0 }}>
                      <Show above="sm">
                        <EditAppPageButton />
                        <AdminAppPageButton />
                      </Show>
                      <Button
                        w={["full", "full", "auto"]}
                        variant={"primaryAction"}
                        rightIcon={<UilArrowUpRight color="#FFFFFF" size={"16px"} />}
                        onClick={goToWebsite}>
                        {t("Go to Website")}
                      </Button>
                      <Show below="sm">
                        <EditAppPageButton />
                        <AdminAppPageButton />
                      </Show>
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

import { notFoundImage } from "@/constants"
import { EndorsementStatus } from "@/types"
import {
  Badge,
  Button,
  Card,
  CardBody,
  Flex,
  HStack,
  Heading,
  Icon,
  Image,
  Link,
  Show,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { UilArrowUpRight, UilCheckCircle, UilExclamationCircle } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useCallback } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useCurrentAppBanner, useCurrentAppLogo, useCurrentAppMetadata } from "../../hooks"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { AdminAppPageButton } from "./components/AdminAppPageButton"
import { AppDetailAllocationInfo } from "./components/AppDetailAllocationInfo"
import { AppDetailSocials } from "./components/AppDetailSocials"
import { AppID } from "./components/AppID"
import { AppReceiverAddress } from "./components/AppReceiverAddress"
import { EditAppPageButton } from "./components/EditAppPageButton"
import { useCurrentAppEndorsementStatus, useGracePeriodEvent } from "@/api"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"

export const AppDetailOverview = () => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { appMetadata, appMetadataLoading, appMetadataError } = useCurrentAppMetadata()
  const { logo, isLogoLoading } = useCurrentAppLogo()
  const { banner, isBannerLoading } = useCurrentAppBanner()
  const {
    status: endorsementStatus,
    threshold: endorsementThreshold,
    isLoading: isEndorsementStatusLoading,
  } = useCurrentAppEndorsementStatus()

  const { data: gracePeriod } = useGracePeriodEvent(app?.id)

  const gracePeriodEndsAt = useEstimateBlockTimestamp({
    blockNumber: Number(gracePeriod?.gracePeriodEvent[0]?.endBlock),
  })

  const goToWebsite = useCallback(() => {
    if (appMetadata?.external_url) {
      window.open(appMetadata.external_url, "_blank")
    }
  }, [appMetadata?.external_url])

  const BADGE_INFORMATION = {
    LOST: {
      badgeText: t("Endorsement lost"),
      badgeTextColor: "#C84968",
      badgeBgColor: "#FCEEF1",
      badgeIcon: UilExclamationCircle,
    },
    PENDING: {
      badgeText: t("Pending endorsement"),
      badgeTextColor: "#AF5F00",
      badgeBgColor: "#FFF3E5",
      badgeIcon: UilExclamationCircle,
    },
    SUCCESS: {
      badgeText: t("Endorsed"),
      badgeTextColor: "#3DBA67",
      badgeBgColor: "#E9FDF1",
      badgeIcon: UilCheckCircle,
    },
    UNKNOWN: {
      badgeText: t("Unknown endorsement status"),
      badgeTextColor: "#AF5F00",
      badgeBgColor: "#FFF3E5",
      badgeIcon: UilExclamationCircle,
    },
  }
  const unknownStatus = endorsementStatus === EndorsementStatus.UNKNOWN
  const endorsementLost = endorsementStatus === EndorsementStatus.LOST
  const StatusBadgeIcon = BADGE_INFORMATION[endorsementStatus].badgeIcon
  return (
    <>
      {endorsementStatus !== EndorsementStatus.SUCCESS ? (
        <HStack w="full" flexWrap="wrap">
          <Badge w="full" bg={BADGE_INFORMATION[endorsementStatus].badgeBgColor} borderRadius="12px">
            <HStack p={2}>
              <Icon
                as={UilExclamationCircle}
                boxSize={30}
                color={BADGE_INFORMATION[endorsementStatus].badgeTextColor}
              />
              <Text
                as="span"
                color={BADGE_INFORMATION[endorsementStatus].badgeTextColor}
                textTransform="none"
                fontWeight="normal"
                whiteSpace="normal"
                wordBreak="break-word"
                flexWrap="wrap"
                fontSize="sm">
                <Trans
                  i18nKey={
                    unknownStatus
                      ? "Unknown endorsement status"
                      : endorsementLost
                        ? "This app lost the endorsement and will not join next allocation. The App will have to reach more than {{endorsementThreshold}} Endorsement score before {{date}} to be included on Allocations rounds. Know more."
                        : "This dApp won’t join next allocation round. The app will have to reach more than {{endorsementThreshold}} Endorsement score to be included on Allocations rounds. Know more."
                  }
                  values={{ date: dayjs(gracePeriodEndsAt).format("MMMM D"), endorsementThreshold }}
                  components={{
                    Link: (
                      <Link color={BADGE_INFORMATION[endorsementStatus].badgeTextColor} textDecoration="underline" />
                    ),
                  }}
                />
              </Text>
            </HStack>
          </Badge>
        </HStack>
      ) : null}
      <Card variant="baseWithBorder">
        <CardBody>
          <VStack align="stretch" gap={4}>
            <Skeleton isLoaded={!isBannerLoading}>
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
            <Flex gap="48px" flexDir={["column", "column", "row"]}>
              <VStack alignItems={"stretch"} flex={3} justify={"space-between"} gap={8}>
                <HStack justify={"space-between"} flexWrap={"wrap"}>
                  <HStack gap={4}>
                    <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
                      <Image src={logo ?? notFoundImage} alt={"logo"} boxSize={"64px"} borderRadius="16px" />
                    </Skeleton>

                    <Skeleton isLoaded={!appMetadataLoading && !isEndorsementStatusLoading}>
                      <Stack flexDir={["column-reverse", "column-reverse", "column"]}>
                        <Badge
                          maxW={"fit-content"}
                          color={BADGE_INFORMATION[endorsementStatus].badgeTextColor}
                          bg={BADGE_INFORMATION[endorsementStatus].badgeBgColor}
                          textTransform="none"
                          justifyContent={"center"}
                          alignItems={"center"}
                          display={"flex"}
                          gap={1}
                          py={"4px"}
                          px={"8px"}
                          borderRadius="12px">
                          <StatusBadgeIcon size={14} color={BADGE_INFORMATION[endorsementStatus].badgeTextColor} />
                          <Text fontWeight="600">{BADGE_INFORMATION[endorsementStatus].badgeText}</Text>
                        </Badge>
                        <Heading fontSize={"28px"} fontWeight={700}>
                          {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                        </Heading>
                      </Stack>
                    </Skeleton>
                  </HStack>
                  <AppDetailSocials socialUrls={appMetadata?.social_urls || []} />
                </HStack>
                <Skeleton isLoaded={!appMetadataLoading}>
                  <Text fontSize={"md"}>
                    {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
                  </Text>
                </Skeleton>
                <Flex flexDirection={{ base: "column", md: "row" }} justify={"space-between"} align={"center"}>
                  <HStack
                    gap={10}
                    w={{ base: "full", md: "auto" }}
                    justifyContent={{ base: "space-between", md: "flex-start" }}>
                    <AppReceiverAddress />
                    <AppID />
                    <VStack>
                      <Text fontSize={"14px"} fontWeight={400} color="#6A6A6A">
                        {t("Member since")}
                      </Text>
                      <Text fontSize={"16px"} fontWeight={400}>
                        {dayjs((app?.createdAtTimestamp || 0) * 1000).format("D MMM, YYYY")}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack
                    justifyContent={{ base: "space-between", md: "flex-end" }}
                    w={{ base: "full", md: "auto" }}
                    mt={{ base: 4, md: 0 }}>
                    <Show above="sm">
                      <EditAppPageButton />
                      <AdminAppPageButton />
                    </Show>
                    <Button
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
                </Flex>
              </VStack>
              <AppDetailAllocationInfo />
            </Flex>
          </VStack>
        </CardBody>
      </Card>
    </>
  )
}

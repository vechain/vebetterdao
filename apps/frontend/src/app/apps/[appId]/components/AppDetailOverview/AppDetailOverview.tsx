import { Button, Card, CardBody, Flex, HStack, Heading, Image, Show, Skeleton, Text, VStack } from "@chakra-ui/react"
import { notFoundImage } from "@/constants"
import { useTranslation } from "react-i18next"
import dayjs from "dayjs"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { useCallback } from "react"
import { AppDetailSocials } from "./components/AppDetailSocials"
import { AppDetailAllocationInfo } from "./components/AppDetailAllocationInfo"
import { EditAppPageButton } from "./components/EditAppPageButton"
import { useCurrentAppBanner, useCurrentAppLogo, useCurrentAppMetadata } from "../../hooks"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { AppReceiverAddress } from "./components/AppReceiverAddress"
import { AdminAppPageButton } from "./components/AdminAppPageButton"
import { AppID } from "./components/AppID"

export const AppDetailOverview = () => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { appMetadata, appMetadataLoading, appMetadataError } = useCurrentAppMetadata()
  const { logo, isLogoLoading } = useCurrentAppLogo()
  const { banner, isBannerLoading } = useCurrentAppBanner()

  const goToWebsite = useCallback(() => {
    if (appMetadata?.external_url) {
      window.open(appMetadata.external_url, "_blank")
    }
  }, [appMetadata?.external_url])

  return (
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
                  <Skeleton isLoaded={!appMetadataLoading}>
                    <Heading fontSize={"28px"} fontWeight={700}>
                      {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                    </Heading>
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
  )
}

import { useXApp } from "@/api"
import { Button, Card, CardBody, Flex, HStack, Heading, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useParams } from "next/navigation"
import { notFoundImage } from "@/constants"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import dayjs from "dayjs"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { useCallback } from "react"
import { AppDetailSocials } from "./components/AppDetailSocials"
import { AppDetailAllocationInfo } from "./components/AppDetailAllocationInfo"
import { EditAppPageButton } from "./components/EditAppPageButton"
import { useCurrentAppBanner, useCurrentAppLogo, useCurrentAppMetadata } from "../../hooks"

export const AppDetailOverview = () => {
  const { appId } = useParams<{ appId: string }>()
  const { t } = useTranslation()
  const { data: xApp } = useXApp(appId)
  const { appMetadata, appMetadataLoading, appMetadataError } = useCurrentAppMetadata()
  const { logo, isLogoLoading } = useCurrentAppLogo()
  const { banner, isBannerLoading } = useCurrentAppBanner()
  console.log("appMetadata", appMetadata)
  console.log("xApp", xApp)

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
              h="220px"
            />
          </Skeleton>
          <Flex gap="48px" flexDir={["column", "column", "row"]}>
            <VStack alignItems={"stretch"} flex={3} justify={"space-between"} gap={8}>
              <HStack justify={"space-between"}>
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
              <HStack justify={"space-between"}>
                <HStack gap={10}>
                  <VStack>
                    <Text fontSize={"14px"} fontWeight={400} color="#6A6A6A">
                      {t("Receiver address")}
                    </Text>
                    <Text fontSize={"16px"} fontWeight={400}>
                      {humanAddress(xApp?.receiverAddress || "", 4, 6)}
                    </Text>
                  </VStack>
                  <VStack>
                    <Text fontSize={"14px"} fontWeight={400} color="#6A6A6A">
                      {t("Member since")}
                    </Text>
                    <Text fontSize={"16px"} fontWeight={400}>
                      {dayjs((xApp?.createdAtTimestamp || 0) * 1000).format("D MMM, YYYY")}
                    </Text>
                  </VStack>
                </HStack>
                <HStack>
                  <EditAppPageButton />
                  <Button
                    variant={"primaryAction"}
                    rightIcon={<UilArrowUpRight color="#FFFFFF" size={"16px"} />}
                    onClick={goToWebsite}>
                    {t("Go to Website")}
                  </Button>
                </HStack>
              </HStack>
            </VStack>
            <AppDetailAllocationInfo />
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  )
}

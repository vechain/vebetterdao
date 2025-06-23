import {
  Card,
  CardBody,
  Divider,
  Heading,
  HStack,
  Image,
  Skeleton,
  Stack,
  Text,
  VStack,
  Show,
  Icon,
} from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { UilAngleRight } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useAppEndorsementStatus, useIpfsImage, useXNode, UnendorsedApp, XApp } from "@/api"
import { notFoundImage } from "@/constants"
import { useXAppStatusConfig } from "../[appId]/hooks"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useXAppMetadata } from "@vechain/vechain-kit"

type Props = {
  xApp: XApp | UnendorsedApp
  layout?: "endorser" | "default"
}

export const UnendorsedAppCard = ({ xApp, layout = "default" }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()

  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(xApp.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const {
    score: endorsementScore,
    threshold: endorsementThreshold,
    status: endorsementStatus,
    isLoading: isEndorsementStatusLoading,
  } = useAppEndorsementStatus(xApp.id)
  const STATUS_CONFIG = useXAppStatusConfig()
  const { color } = STATUS_CONFIG[endorsementStatus as keyof typeof STATUS_CONFIG] ?? { color: "#6A6A6A" }

  const { isXNodeLoading, isEndorsingApp, isXNodeHolder, endorsedApp, xNodePoints } = useXNode()
  const isUserAppEndorser = useMemo(() => {
    if (!xApp || isXNodeLoading) return false
    return isXNodeHolder && isEndorsingApp && compareAddresses(xApp.id, endorsedApp?.id)
  }, [xApp, isXNodeLoading, isXNodeHolder, isEndorsingApp, endorsedApp])

  const onCardClick = useCallback(() => {
    router.push(`/apps/${xApp.id}`)
  }, [router, xApp.id])

  const isNewApp = useMemo(() => {
    if (!xApp) return false
    return xApp.isNew
  }, [xApp])

  return (
    <Card
      variant={"baseWithBorder"}
      w="full"
      onClick={onCardClick}
      maxW="100%"
      _hover={{
        cursor: "pointer",
        backgroundColor: "hover-contrast-bg",
        transition: "all 0.3s",
      }}>
      <CardBody py="16px" px="24px">
        <Stack
          direction={layout === "endorser" ? "column" : { base: "column", lg: "row" }}
          align="stretch"
          w="full"
          h="full">
          <Stack direction="row" spacing={4} align="center" flex="1">
            <Skeleton isLoaded={!isLogoLoading}>
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
              <Skeleton isLoaded={!appMetadataLoading}>
                <HStack spacing={4} align="center">
                  <Heading
                    fontWeight={700}
                    fontSize="20px"
                    noOfLines={1}
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
                      spacing={1}
                      flexShrink={0}>
                      <Image src="/assets/icons/new-app-gray.svg" alt="new" boxSize={3} mr={1} />
                      <Text>{t("New!")}</Text>
                    </HStack>
                  )}
                </HStack>
              </Skeleton>
              <Skeleton isLoaded={!appMetadataLoading}>
                <Text fontSize="14px" color="#6A6A6A" fontWeight={400} noOfLines={2}>
                  {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
                </Text>
              </Skeleton>
            </Stack>
          </Stack>

          <Show above="md">
            <Divider orientation="vertical" h="100%" />
          </Show>
          <Show below="md">
            <Divider orientation="horizontal" h="100%" />
          </Show>

          {/* Right Section: Score */}
          <Stack direction="row" align="center" justify="center">
            <Stack
              direction={layout === "endorser" ? "row" : { base: "row", lg: "column", md: "column" }}
              spacing={3}
              align={{ base: "center", lg: "stretch", md: "stretch" }}
              justify={{ base: "space-between", md: "stretch" }}
              w="full">
              <VStack gap={0} alignItems="flex-start">
                <Skeleton isLoaded={!isEndorsementStatusLoading}>
                  <HStack spacing={1}>
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
                  <Skeleton isLoaded={!isXNodeLoading}>
                    <Text fontSize="24px" fontWeight="700" color="#004CFC">
                      {xNodePoints}
                    </Text>
                  </Skeleton>
                  <Text fontSize="12px" color="#6A6A6A">
                    {t("Your score")}
                  </Text>
                </VStack>
              )}
            </Stack>
            <Show above="md">
              <Icon as={UilAngleRight} boxSize={"32px"} color={"#004CFC"} alignSelf={"center"} />
            </Show>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  )
}

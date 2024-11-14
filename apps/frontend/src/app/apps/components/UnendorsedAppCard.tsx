import { UnendorsedApp, useAppEndorsementStatus, useXAppMetadata, useXNode, XApp } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import {
  Box,
  Card,
  CardBody,
  Divider,
  Heading,
  HStack,
  Icon,
  Image,
  Show,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { UilAngleRight } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useXAppStatusConfig } from "../[appId]/hooks"
import { compareAddresses } from "@repo/utils/AddressUtils"

type Props = {
  xApp: XApp | UnendorsedApp
}

export const UnendorsedAppCard = ({ xApp }: Props) => {
  const { t } = useTranslation()

  const router = useRouter()

  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(xApp.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const {
    score: endorsementScore,
    status: endorsementStatus,
    threshold: endorsementThreshold,
    isLoading: isEndorsementStatusLoading,
  } = useAppEndorsementStatus(xApp.id)

  const STATUS_CONFIG = useXAppStatusConfig()
  const { color } = STATUS_CONFIG[endorsementStatus] ?? { color: "#6A6A6A" }

  // User xnodes, TODO support multiple xnodes
  const { isXNodeLoading, isEndorsingApp, isXNodeHolder, endorsedApp, xNodePoints } = useXNode()
  const isUserAppEndorser = useMemo(() => {
    if (!xApp || isXNodeLoading) return false
    return isXNodeHolder && isEndorsingApp && compareAddresses(xApp.id, endorsedApp?.id)
  }, [xApp, isXNodeLoading, isXNodeHolder, isEndorsingApp, endorsedApp])

  const onCardClick = useCallback(() => {
    router.push(`/apps/${xApp.id}`)
  }, [router, xApp.id])

  return (
    <Card
      variant={"baseWithBorder"}
      w="full"
      onClick={onCardClick}
      _hover={{
        cursor: "pointer",
        backgroundColor: "gray.50",
        transition: "all 0.3s",
      }}>
      <CardBody py="16px" px="24px">
        <Stack
          direction={["column", "column", "row"]}
          spacing={8}
          align={"stretch"}
          w={"full"}
          h="full"
          justify={"space-between"}>
          <VStack spacing={4} align="flex-start" flex={5} my={[0, 0, 4]}>
            {/* Wrapper Stack for Image and Text */}
            <HStack w="full" spacing={4} align="flex-start">
              {/* Image and Icon */}
              <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
                <Image
                  src={logo?.image ?? notFoundImage}
                  alt="logo"
                  h={{ base: "48px", sm: "60px", md: "72px" }} // Shrinks on small screens
                  w={{ base: "48px", sm: "60px", md: "72px" }} // Matches height to maintain aspect ratio
                  minW="48px" // Minimum width for the image to avoid too-small scaling
                  borderRadius="9px"
                />
              </Skeleton>

              {/* Title and Description */}
              <Stack
                direction="column" // Always stacked vertically for title and description
                spacing={2}
                flex="1"
                align="flex-start"
                maxW={{ base: "70%", md: "auto" }}>
                <Box>
                  <Skeleton isLoaded={!appMetadataLoading}>
                    <Heading
                      fontWeight={700}
                      fontSize={"20px"}
                      whiteSpace="nowrap" // Prevents the title from wrapping
                      overflow="hidden"
                      textOverflow="ellipsis">
                      {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                    </Heading>
                  </Skeleton>
                  <Skeleton isLoaded={!appMetadataLoading}>
                    <Text fontSize={"14px"} color={"#6A6A6A"} fontWeight={400} noOfLines={2}>
                      {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
                    </Text>
                  </Skeleton>
                </Box>
              </Stack>
            </HStack>
          </VStack>
          <Show above="md">
            <Divider orientation="vertical" h="100%" />
          </Show>
          <Show below="md">
            <Divider orientation="horizontal" h="full" />
          </Show>
          <Stack
            direction={["row", "row", "column"]}
            flex={1}
            spacing={3}
            align="flex-start"
            justify={"space-between"}
            my={[0, 0, 4]}>
            <VStack gap={0} alignItems="flex-start">
              <Skeleton isLoaded={!isEndorsementStatusLoading}>
                <HStack spacing={1} alignItems="flex-end">
                  <Text fontSize={"24px"} fontWeight="700" color={color}>
                    {endorsementScore}
                  </Text>
                  <Text fontSize={"14px"} color={color} pb="3.5px">{`/${endorsementThreshold}`}</Text>
                </HStack>
              </Skeleton>
              <Text fontSize="12px" color="#6A6A6A">
                {t("Total score")}
              </Text>
            </VStack>

            {isUserAppEndorser && (
              <VStack gap={0} alignItems="flex-start">
                <Skeleton isLoaded={!isXNodeLoading}>
                  <Text fontSize={"24px"} fontWeight="700" color="#004CFC">
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
      </CardBody>
    </Card>
  )
}

import { useAppEndorsementScore, useAppEndorsers, useXAppMetadata } from "@/api"
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
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { XAppInformations } from "./AppsPageContent"
import { NodeStrengthLevelToImage } from "@/constants/XNode"

type StatusType = "LOST" | "PENDING" | "SUCCESS" | "UNKNOWN"

// TODO: review
export const AppCards = ({
  xAppId,
  xNodePoints,
  xNodeLevel,
  variant,
  status,
}: XAppInformations & { status?: StatusType }) => {
  const router = useRouter()
  const { t } = useTranslation()
  const { data: endorsers } = useAppEndorsers(xAppId)
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(xAppId)
  const { data, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)
  const endorsementScore = useAppEndorsementScore(xAppId)

  const onCardClick = useCallback(() => {
    router.push(`/apps/${xAppId}`)
  }, [router, xAppId])

  const truncateDescription = (maxWords: number, description?: string) => {
    const words = description?.split(" ")
    if (words && words.length > maxWords) {
      return words?.slice(0, maxWords).join(" ") + "..."
    }
    return description
  }

  const SCORE_COLOR_SCHEME = {
    LOST: {
      cardBorderColor: "#C84968",
      cardBoxShadow: "0px 0px 5px 0px #D23F6366",
      textColor: "#C84968",
    },
    PENDING: {
      cardBorderColor: "#FFE4C3",
      cardBoxShadow: "0px 0px 7.9px 0px #F29B3280",
      textColor: "#F29B32",
    },
    SUCCESS: {
      cardBorderColor: "none",
      cardBoxShadow: "none",
      textColor: "#3DBA67",
    },
    UNKNOWN: {
      cardBorderColor: "#D5D5D5",
      cardBoxShadow: "none",
      textColor: "#6A6A6A",
    },
  }
  const cardStyles = status
    ? SCORE_COLOR_SCHEME[status]
    : {
        cardBoxShadow: "none",
        cardBorderColor: "gray.200",
        textColor: "#F29B32",
      }

  return (
    <Card
      boxShadow={cardStyles.cardBoxShadow}
      borderColor={cardStyles.cardBorderColor}
      w="full"
      onClick={onCardClick}
      _hover={{
        cursor: "pointer",
        backgroundColor: "gray.50",
        transition: "all 0.3s",
      }}>
      <CardBody py="16px" px="24px">
        <Stack
          direction={["column", "row", "row"]}
          spacing={8}
          align={"stretch"}
          w={"full"}
          h="full"
          justify={"space-between"}>
          <VStack spacing={4} align="flex-start" flex={5} my={[0, 0, 4]}>
            <HStack w="full" spacing={4} align={["flex-start", "flex-start", "center"]}>
              <HStack w={["full", "full", "auto"]} align="flex-start" justify={"space-between"}>
                <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
                  <Box width="72px" height="72px" borderRadius="9px" overflow="hidden">
                    <Image
                      src={data?.image ?? notFoundImage}
                      alt={"logo"}
                      width="100%"
                      height="100%"
                      objectFit="cover"
                    />
                  </Box>
                </Skeleton>

                <Stack direction={["column", "column", "column"]} spacing={2} align="flex-start">
                  <Box>
                    <Skeleton isLoaded={!appMetadataLoading}>
                      <Heading fontWeight={700} fontSize={"24px"}>
                        {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                      </Heading>
                    </Skeleton>
                  </Box>
                  <Skeleton isLoaded={!appMetadataLoading}>
                    <Text fontSize={"14px"} color={"#6A6A6A"} fontWeight={400}>
                      {truncateDescription(
                        19,
                        appMetadata?.description ?? appMetadataError?.message ?? "Error loading description",
                      )}
                    </Text>
                  </Skeleton>
                </Stack>
              </HStack>
            </HStack>

            {variant == "endorsedApps" && (
              <HStack>
                <Image
                  src={NodeStrengthLevelToImage[(xNodeLevel ?? 0).toString()]}
                  boxSize="24px"
                  alt={`Node lvl ${xNodeLevel}`}
                  bg="transparent"
                />
                <Text color={"#29295C"} fontSize="small" fontWeight={400}>
                  {t("You are endorsing this app with {{value}} points", { value: xNodePoints })}
                </Text>
              </HStack>
            )}

            {variant == "allApps" && (
              <Show above="md">
                <HStack spacing={2}>
                  <Text color={"#004CFC"}>{t("Go to app")}</Text>
                  <Icon as={UilAngleRight} boxSize={"32px"} color={"#004CFC"} />
                </HStack>
              </Show>
            )}
          </VStack>

          {/* todo: check out why the divider doesn't show vertically */}
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
            <VStack spacing={1} align="flex-start" w="full">
              <HStack spacing={1} align={"flex-end"} color={cardStyles.textColor}>
                <Heading fontSize={"36px"} fontWeight={700} lineHeight={"36px"}>
                  {endorsementScore.data}
                </Heading>
                <Text fontSize={"14px"} color={cardStyles.textColor} fontWeight={400} lineHeight={"24px"}>
                  {/* TODO: pass the real data */}
                  {/* {t("/100", {
                    value: endorsementScoreThreshold.data,
                  })} */}
                  {t("/100")}
                </Text>
              </HStack>

              <Text fontSize={"sm"} color={"gray.500"}>
                {t("Total score")}
              </Text>

              {status == "LOST" && (
                <Text fontSize={"14px"} color={"#C84968"} fontWeight={400} lineHeight={"24px"}>
                  {t("Endorsement lost")}
                </Text>
              )}
            </VStack>

            {variant == "endorsedApps" && (
              <VStack spacing={1} align="flex-start" w="full">
                <HStack spacing={1} align={"flex-end"}>
                  <Heading fontSize={"36px"} fontWeight={700} color={"#444AD1"} lineHeight={"36px"}>
                    {endorsers?.length}
                  </Heading>
                </HStack>
                <Text fontSize={"sm"} color={"gray.500"}>
                  {t("Users endorsing")}
                </Text>
              </VStack>
            )}
            <Show below="sm">
              <Icon as={UilAngleRight} boxSize={"32px"} color={"#004CFC"} />
            </Show>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  )
}

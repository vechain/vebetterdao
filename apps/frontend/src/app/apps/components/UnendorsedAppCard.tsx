import { UnendorsedApp, useAppEndorsementScore, useEndorsementScoreThreshold, useXAppMetadata, XApp } from "@/api"
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

type Props = {
  xApp: XApp | UnendorsedApp
}

export const UnendorsedAppCard = ({ xApp }: Props) => {
  const { t } = useTranslation()

  const router = useRouter()

  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(xApp.id)

  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const endorsementScore = useAppEndorsementScore(xApp.id)
  const endorsementScoreThreshold = useEndorsementScoreThreshold()

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
            <Stack
              w="full"
              direction={["column", "column", "row"]}
              spacing={4}
              align={["flex-start", "flex-start", "center"]}>
              <HStack w={["full", "full", "auto"]} align="flex-start" justify={"space-between"}>
                <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
                  <Image src={logo?.image ?? notFoundImage} alt={"logo"} h={"72px"} w="full" borderRadius="9px" />
                </Skeleton>
                <Show below="sm">
                  <Icon as={UilAngleRight} boxSize={"32px"} color={"#004CFC"} />
                </Show>
              </HStack>
              <Stack direction={["column-reverse", "column-reverse", "column"]} spacing={2} align="flex-start">
                <Box>
                  <Skeleton isLoaded={!appMetadataLoading}>
                    <Heading fontWeight={700} fontSize={"24px"}>
                      {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                    </Heading>
                  </Skeleton>
                </Box>
              </Stack>
            </Stack>
            <Skeleton isLoaded={!appMetadataLoading}>
              <Text fontSize={"14px"} color={"#6A6A6A"} fontWeight={400} noOfLines={2}>
                {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
              </Text>
            </Skeleton>
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
            <VStack spacing={1} align="flex-start" w="full">
              <HStack spacing={1} align={"flex-end"}>
                <Heading fontSize={"36px"} fontWeight={700} color={"#F29B32"} lineHeight={"36px"}>
                  {endorsementScore.data}
                </Heading>
                <Text fontSize={"14px"} color={"#6A6A6A"} fontWeight={400} lineHeight={"24px"}>
                  {t("of {{value}}", {
                    value: endorsementScoreThreshold.data,
                  })}
                </Text>
              </HStack>

              <Text fontSize={"sm"} color={"gray.500"}>
                {t("Endorsement score")}
              </Text>
            </VStack>
          </Stack>
          <Show above="md">
            <Icon as={UilAngleRight} boxSize={"32px"} color={"#004CFC"} alignSelf={"center"} />
          </Show>
        </Stack>
      </CardBody>
    </Card>
  )
}

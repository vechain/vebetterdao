import { UnendorsedApp, useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { Button, Card, CardBody, HStack, Icon, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilStar } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

type Props = {
  xApp: UnendorsedApp
}

export const UnendorsedAppCard = ({ xApp }: Props) => {
  const { t } = useTranslation()
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(xApp.id)

  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  return (
    <Card variant={"baseWithBorder"} w="full">
      <CardBody mt={5}>
        <VStack spacing={6} align="flex-start" w="full">
          <HStack spacing={3} align={"center"} w={"full"}>
            <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
              <Image src={logo?.image ?? notFoundImage} alt={"logo"} boxSize={14} borderRadius="9px" />
            </Skeleton>
            <VStack spacing={1} align="flex-start" w="full">
              <HStack spacing={1} align="center" w={"full"}>
                <Button leftIcon={<Icon as={UilStar} />} color="#F29B32" bg="#FFF3E5" borderRadius={"12px"} size={"xs"}>
                  {t("Looking for support")}
                </Button>
                <Button
                  leftIcon={<Icon as={UilStar} />}
                  bg="#B1F16C"
                  borderRadius={"12px"}
                  color={"#3B3B3B"}
                  fontWeight={600}
                  size={"xs"}>
                  {t("New")}
                </Button>
              </HStack>
              <Skeleton isLoaded={!appMetadataLoading}>
                <Text fontWeight={"600"} size={"xs"}>
                  {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                </Text>
              </Skeleton>
              <Text fontSize={"14px"} fontWeight={400} color={"gray.500"}>
                {t("Submitted on {{date}}", { date: dayjs.unix(xApp.createdAtTimestamp).format("MMMM DD, YYYY") })}
              </Text>
            </VStack>
          </HStack>
          <Skeleton isLoaded={!appMetadataLoading}>
            <Text fontSize={"sm"} color={"gray.500"}>
              {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
            </Text>
          </Skeleton>
        </VStack>
      </CardBody>
    </Card>
  )
}

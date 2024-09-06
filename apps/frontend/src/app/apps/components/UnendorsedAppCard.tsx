import {
  UnendorsedApp,
  useAppEndorsementScore,
  useAppEndorsers,
  useEndorsementScoreThreshold,
  useXAppMetadata,
} from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  Image,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { UilStar } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { EndorseAppModal } from "./EndorseAppModal"

type Props = {
  xApp: UnendorsedApp
}

export const UnendorsedAppCard = ({ xApp }: Props) => {
  const { t } = useTranslation()
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(xApp.id)

  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const endorsers = useAppEndorsers(xApp.id)
  const endorsementScore = useAppEndorsementScore(xApp.id)
  const endorsementScoreThreshold = useEndorsementScoreThreshold()

  const { isOpen, onClose, onOpen } = useDisclosure()

  return (
    <>
      <EndorseAppModal xApp={xApp} isOpen={isOpen} onClose={onClose} />
      <Card
        px="16px"
        py="24px"
        variant={"baseWithBorder"}
        w="full"
        onClick={onOpen}
        _hover={{
          cursor: "pointer",
          backgroundColor: "gray.50",
        }}>
        <CardBody>
          <Stack
            direction={["column", "column", "row"]}
            spacing={8}
            align={"stretch"}
            w={"full"}
            justify={"space-between"}>
            <VStack spacing={6} align="flex-start" w="full">
              <Stack direction={["column", "column", "row"]} spacing={4} w={"full"}>
                <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
                  <Image src={logo?.image ?? notFoundImage} alt={"logo"} boxSize={14} borderRadius="9px" />
                </Skeleton>
                <Stack
                  direction={["column-reverse", "column-reverse", "column"]}
                  spacing={2}
                  align="flex-start"
                  w="full">
                  <HStack spacing={1} align="center" w={"full"}>
                    <Button
                      leftIcon={<Icon as={UilStar} />}
                      color="#F29B32"
                      bg="#FFF3E5"
                      borderRadius={"12px"}
                      size={"xs"}>
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
                  <Box>
                    <Skeleton isLoaded={!appMetadataLoading}>
                      <Text fontWeight={"600"} size={"xs"}>
                        {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                      </Text>
                    </Skeleton>
                    <Text fontSize={"14px"} fontWeight={400} color={"gray.500"}>
                      {t("Submitted on {{date}}", {
                        date: dayjs.unix(xApp.createdAtTimestamp).format("MMMM DD, YYYY"),
                      })}
                    </Text>
                  </Box>
                </Stack>
              </Stack>
              <Skeleton isLoaded={!appMetadataLoading}>
                <Text fontSize={"sm"} color={"gray.500"}>
                  {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
                </Text>
              </Skeleton>
            </VStack>
            {/* <Divider orientation="vertical" flex={1} h="full" /> */}
            <Stack direction={["row", "row", "column"]} spacing={3} align="flex-start" justify={"space-between"}>
              <VStack spacing={1} align="flex-start" w="full">
                <Heading size={"sm"}>
                  {t("{{first}} of {{second}}", {
                    first: endorsementScore.data,
                    second: endorsementScoreThreshold.data,
                  })}
                </Heading>

                <Text fontSize={"sm"} color={"gray.500"}>
                  {t("Endorsement score")}
                </Text>
              </VStack>
              <VStack spacing={1} align="flex-start" w="full">
                <Heading size={"sm"}>{endorsers.data?.length}</Heading>

                <Text fontSize={"sm"} color={"gray.500"}>
                  {t("Users endorsing")}
                </Text>
              </VStack>
            </Stack>
          </Stack>
        </CardBody>
      </Card>
    </>
  )
}

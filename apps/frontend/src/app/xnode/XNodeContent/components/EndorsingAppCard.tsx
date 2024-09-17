import { useAppEndorsementScore, useAppEndorsers, useXNode } from "@/api"
import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import {
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  Heading,
  HStack,
  Image,
  Show,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react"
import { UilCheckCircle, UilInfoCircle, UilSearch } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

export const EndorsingAppCard = () => {
  const { t } = useTranslation()
  const { isEndorsingApp, endorsedApp, xNodePoints, xNodeId } = useXNode()
  // get the number of endorsers for the endorsed app
  const endorsersCount = useAppEndorsers(endorsedApp?.id)?.data?.length ?? 0
  // get app total endorsement score
  const appScore = useAppEndorsementScore(endorsedApp?.id)?.data ?? 0

  // get the last endorsement event for the endorsed app
  const { data: appEndorsedEvents } = useAppEndorsedEvents({
    nodeId: xNodeId,
    appId: endorsedApp?.id,
    endorsed: true,
  })

  const lastEndorsementTimestamp = useEstimateBlockTimestamp({ blockNumber: appEndorsedEvents?.[0]?.blockNumber })
  const endorsingSince = dayjs(lastEndorsementTimestamp).fromNow()

  const stopEndorsingButton = useMemo(() => {
    return <Button variant="dangerGhost">{t("Stop endorsing")}</Button>
  }, [t])

  const router = useRouter()
  const goToApps = useCallback(() => {
    router.push("/apps")
  }, [router])

  const searchIconSize = useBreakpointValue({ base: "4rem", md: "6rem" })

  return (
    <Card variant="baseWithBorder" w="full" h="min-content">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="lg">{t("Endorsing app")}</Heading>
              {isEndorsingApp && <UilInfoCircle color="#004CFC" />}
            </HStack>
            {isEndorsingApp && (
              <Text fontSize="sm">
                {t(
                  "As the owner of an XNode, you can use your points to endorse apps and help them be voted in allocation rounds.",
                )}
              </Text>
            )}
          </VStack>
          {isEndorsingApp ? (
            <Card variant={"baseWithBorder"} p={4} rounded="lg">
              <VStack align="stretch" spacing={6}>
                <HStack justify={"space-between"}>
                  <HStack>
                    <Image src={endorsedApp?.logo} alt="endorsed-app" w="12" h="12" rounded="xl" />
                    <VStack align="stretch">
                      <HStack bg="#E9FDF1" p={"4px 10px"} rounded="12px">
                        <UilCheckCircle color="#3DBA67" size={"1rem"} />
                        <Text color="#3DBA67" fontSize="sm">
                          {t("Endorsed")}
                        </Text>
                      </HStack>
                      <Heading fontSize="lg" fontWeight={"600"}>
                        {endorsedApp?.name}
                      </Heading>
                    </VStack>
                  </HStack>
                  <Show above="md">{stopEndorsingButton}</Show>
                </HStack>
                <Divider />
                <HStack justify={"space-between"} flexWrap={"wrap"}>
                  <VStack align="flex-start" gap={0} my={"3"}>
                    <Text>
                      {appScore} {t("points")}
                    </Text>
                    <Text fontSize="xs" color="#6A6A6A">
                      {t("Current score")}
                    </Text>
                  </VStack>
                  <VStack align="flex-start" gap={0} my={"3"}>
                    <Text>{endorsersCount}</Text>
                    <Text fontSize="xs" color="#6A6A6A">
                      {t("Endorsing users")}
                    </Text>
                  </VStack>
                  <VStack align="flex-start" gap={0} my={"3"}>
                    <Text>
                      {xNodePoints} {t("points")}
                    </Text>
                    <Text fontSize="xs" color="#6A6A6A">
                      {t("My endorsement")}
                    </Text>
                  </VStack>
                  <VStack align="flex-start" gap={0} my={"3"}>
                    <Text>{endorsingSince}</Text>
                    <Text fontSize="xs" color="#6A6A6A">
                      {t("Endorsing since")}
                    </Text>
                  </VStack>
                </HStack>
                <Show below="md">{stopEndorsingButton}</Show>
              </VStack>
            </Card>
          ) : (
            <Flex align="center" justify={"center"} p={["8", "8", "12"]} bg="#F8F8F8" rounded="2xl" mt="2">
              <VStack align="center" spacing={2} maxW="27rem" textAlign={"center"}>
                <UilSearch size={searchIconSize} color="#757575" />
                <Heading fontSize="xl" color="#757575" fontWeight={"500"}>
                  {t("You’re not endorsing any app")}
                </Heading>
                <Text color="#757575">
                  {t(
                    "Browse the apps that are looking for endorsement and use your score to help them join the allocation rounds!",
                  )}
                </Text>
                <Button variant="primaryAction" onClick={goToApps} mt={4} w={["full", "full", "auto"]}>
                  {t("Browse apps")}
                </Button>
              </VStack>
            </Flex>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

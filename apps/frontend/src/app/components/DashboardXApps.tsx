import { XApp, useMostVotedAppsInRound, usePreviousAllocationRoundId, useAppsEligibleInNextRound } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import {
  Card,
  CardBody,
  CardHeader,
  HStack,
  Heading,
  Image,
  Skeleton,
  Text,
  VStack,
  Grid,
  useColorModeValue,
  Button,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { v4 as uuid } from "uuid"
import { useXAppMetadata } from "@vechain/vechain-kit"

type Props = {
  maxApps?: number
}

export const DashboardXApps = ({ maxApps = 4 }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()

  // Apps are listed based on the votes they received in the previous round and are eligible in the next round
  const { data: previousRoundId } = usePreviousAllocationRoundId()
  const { data: allMostVotedXApps } = useMostVotedAppsInRound(previousRoundId ?? "")
  const { data: eligibleAppsIds } = useAppsEligibleInNextRound()

  const xApps = useMemo(() => {
    return allMostVotedXApps?.filter(app => eligibleAppsIds?.includes(app.id)) ?? []
  }, [allMostVotedXApps, eligibleAppsIds])

  const slicedXApps = useMemo(() => xApps?.slice(0, maxApps), [xApps, maxApps])

  if (!slicedXApps?.length) return null

  return (
    <Card variant="baseWithBorder">
      <CardHeader>
        <VStack w="full" justify={"flex-start"} align={"start"}>
          <HStack w="full" justify={"space-between"}>
            <Heading size="md">{t("Explore Apps")}</Heading>
            {!!xApps && xApps.length > maxApps && (
              <Button
                variant="link"
                colorScheme="primary"
                rightIcon={<FiArrowUpRight />}
                onClick={() => router.push("/apps")}>
                {t("See all")}
              </Button>
            )}
          </HStack>

          <Text fontSize={"md"} color={"gray.500"}>
            {t("Use our apps to complete sustainable actions and earn token rewards.")}
          </Text>
        </VStack>
      </CardHeader>
      <CardBody>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          {slicedXApps?.map(xApp => <DashboardXAppCard key={`xApp-${xApp?.id ?? uuid()}`} xApp={xApp.app} />)}
        </Grid>
      </CardBody>
    </Card>
  )
}

const DashboardXAppCard = ({ xApp }: { xApp: XApp }) => {
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(xApp.id)
  const router = useRouter()
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const nonActiveBackgroundColor = useColorModeValue("rgba(166, 217, 110, 0.12)", "rgba(166, 217, 110, 0.12)")
  const cardBackgroundColor = useColorModeValue("#F7F7F7", "#131313")
  const navigateToAppDetail = useCallback(() => {
    router.push(`/apps/${xApp.id}`)
  }, [router, xApp.id])
  return (
    <Card
      variant={"baseWithBorder"}
      backgroundColor={cardBackgroundColor}
      onClick={navigateToAppDetail}
      _hover={{
        bg: nonActiveBackgroundColor,

        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}>
      <CardBody>
        <VStack alignItems={"start"} justify={"flex-start"} spacing={6}>
          <HStack spacing={3} justifyContent={"start"} w={"full"} alignItems={"center"}>
            <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
              <Image src={logo?.image ?? notFoundImage} alt={"logo"} maxW={"40px"} borderRadius="9px" />
            </Skeleton>

            <VStack spacing={1} align="flex-start" w={"fit-content"}>
              <Skeleton isLoaded={!appMetadataLoading} justifyContent={"end"}>
                <Heading size={"sm"}>{appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}</Heading>
              </Skeleton>
            </VStack>
          </HStack>

          <HStack spacing={3} justifyContent={"space-between"} w={"full"} alignItems={"start"}>
            <Skeleton isLoaded={!appMetadataLoading} justifyContent={"end"}>
              <Text fontSize={"sm"} color={"gray.500"}>
                {appMetadata?.description
                  ? appMetadata.description.slice(0, 150) + "..."
                  : appMetadataError?.message
                    ? appMetadataError.message
                    : "Error loading description"}
              </Text>
            </Skeleton>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

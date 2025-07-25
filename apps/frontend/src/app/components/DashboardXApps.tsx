import {
  XApp,
  useMostVotedAppsInRound,
  usePreviousAllocationRoundId,
  useAppsEligibleInNextRound,
  useXAppMetadata,
} from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { Card, HStack, Heading, Image, Skeleton, Text, VStack, Grid, Link } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { v4 as uuid } from "uuid"
import { useTheme } from "next-themes"
import NextLink from "next/link"
import { useRouter } from "next/navigation"

type Props = {
  maxApps?: number
}

export const DashboardXApps = ({ maxApps = 4 }: Props) => {
  const { t } = useTranslation()
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
    <Card.Root variant="baseWithBorder">
      <Card.Header>
        <VStack w="full" justify={"flex-start"} align={"start"}>
          <HStack w="full" justify={"space-between"}>
            <Heading size="md">{t("Explore Apps")}</Heading>
            {!!xApps && xApps.length > maxApps && (
              <Link asChild variant="plain" colorPalette="primary">
                <NextLink href="/apps">
                  {t("See all")}
                  <FiArrowUpRight />
                </NextLink>
              </Link>
            )}
          </HStack>

          <Text fontSize={"md"} color={"gray.500"}>
            {t("Use our apps to complete sustainable actions and earn token rewards.")}
          </Text>
        </VStack>
      </Card.Header>
      <Card.Body>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          {slicedXApps?.map(xApp => (
            <DashboardXAppCard key={`xApp-${xApp?.id ?? uuid()}`} xApp={xApp.app} />
          ))}
        </Grid>
      </Card.Body>
    </Card.Root>
  )
}

const DashboardXAppCard = ({ xApp }: { xApp: XApp }) => {
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(xApp.id)
  const router = useRouter()
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)
  const { theme } = useTheme()

  const nonActiveBackgroundColor = theme === "light" ? "rgba(166, 217, 110, 0.12)" : "rgba(166, 217, 110, 0.12)"
  const cardBackgroundColor = theme === "light" ? "#F7F7F7" : "#131313"
  const navigateToAppDetail = useCallback(() => {
    router.push(`/apps/${xApp.id}`)
  }, [router, xApp.id])
  return (
    <Card.Root
      variant={"baseWithBorder"}
      backgroundColor={cardBackgroundColor}
      onClick={navigateToAppDetail}
      _hover={{
        bg: nonActiveBackgroundColor,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}>
      <Card.Body>
        <VStack alignItems={"start"} justify={"flex-start"} gap={6}>
          <HStack gap={3} justifyContent={"start"} w={"full"} alignItems={"center"}>
            <Skeleton loading={isLogoLoading} alignContent={"start"}>
              <Image src={logo?.image ?? notFoundImage} alt={"logo"} maxW={"40px"} borderRadius="9px" />
            </Skeleton>

            <VStack gap={1} align="flex-start" w={"fit-content"}>
              <Skeleton loading={appMetadataLoading} justifyContent={"end"}>
                <Heading size={"sm"}>{appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}</Heading>
              </Skeleton>
            </VStack>
          </HStack>

          <HStack gap={3} justifyContent={"space-between"} w={"full"} alignItems={"start"}>
            <Skeleton loading={appMetadataLoading} justifyContent={"end"}>
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
      </Card.Body>
    </Card.Root>
  )
}

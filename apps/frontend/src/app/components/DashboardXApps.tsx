import {
  XApp,
  useMostVotedAppsInRound,
  usePreviousAllocationRoundId,
  useAppsEligibleInNextRound,
  useXAppMetadata,
} from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import {
  Card,
  HStack,
  Heading,
  Image,
  Skeleton,
  Text,
  VStack,
  Grid,
  Link,
  LinkBox,
  LinkOverlay,
  Icon,
} from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { MdKeyboardArrowRight } from "react-icons/md"
import { v4 as uuid } from "uuid"
import NextLink from "next/link"

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
    <Card.Root variant="primary">
      <Card.Header pb={4}>
        <VStack w="full" justify={"flex-start"} align={"start"}>
          <HStack w="full" justify={"space-between"}>
            <Heading size="xl" color="text.default">
              {t("Explore Apps")}
            </Heading>
            {!!xApps && xApps.length > maxApps && (
              <Link asChild textStyle="sm" fontWeight="semibold">
                <NextLink href="/apps">
                  {t("See all")}
                  <Icon size="sm" as={MdKeyboardArrowRight} />
                </NextLink>
              </Link>
            )}
          </HStack>

          <Text textStyle={"sm"} color={"text.subtle"}>
            {t("Use our apps to complete sustainable actions and earn token rewards.")}
          </Text>
        </VStack>
      </Card.Header>
      <Card.Body>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap="6" w="full">
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
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle">
        <Card.Body>
          <LinkOverlay href={`/apps/${xApp.id}`}>
            <VStack alignItems={"start"} justify={"flex-start"} gap={3}>
              <HStack gap={3} justifyContent={"start"} w={"full"} alignItems={"center"}>
                <Skeleton loading={isLogoLoading} alignContent={"start"}>
                  <Image
                    src={logo?.image ?? notFoundImage}
                    alt={"logo"}
                    aspectRatio={1}
                    maxW={"40px"}
                    borderRadius="9px"
                  />
                </Skeleton>

                <VStack gap={1} align="flex-start" w={"fit-content"}>
                  <Skeleton loading={appMetadataLoading} justifyContent={"end"}>
                    <Heading size={"md"}>
                      {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                    </Heading>
                  </Skeleton>
                </VStack>
              </HStack>

              <HStack gap={3} justifyContent={"space-between"} w={"full"} alignItems={"start"}>
                <Skeleton loading={appMetadataLoading} justifyContent={"end"}>
                  <Text textStyle={"sm"} color={"text.subtle"}>
                    {appMetadata?.description
                      ? appMetadata.description.slice(0, 150) + "..."
                      : appMetadataError?.message
                        ? appMetadataError.message
                        : "Error loading description"}
                  </Text>
                </Skeleton>
              </HStack>
            </VStack>
          </LinkOverlay>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}

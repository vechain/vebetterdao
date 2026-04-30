"use client"

import { Button, Card, Heading, HStack, Icon, SimpleGrid, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { LuCompass, LuUsers } from "react-icons/lu"

import { useNavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"
import {
  useNavigatorOverview,
  useNavigators,
  type NavigatorEntityFormatted,
} from "@/api/indexer/navigators/useNavigators"
import { AddressIcon } from "@/components/AddressIcon"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"
import Vot3Svg from "@/components/Icons/svg/vot3-icon.svg"

const formatter = getCompactFormatter(2)

export const NavigatorDiscoveryCard = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { data: overview, isLoading: overviewLoading } = useNavigatorOverview()
  const { data: newestNavigators, isLoading: newestLoading } = useNavigators({
    orderBy: "registeredAt",
    direction: "DESC",
    size: 3,
    status: ["ACTIVE"],
  })

  if (!account?.address) return null

  return (
    <Card.Root w="full" variant="primary">
      <Card.Body>
        <VStack gap={4} align="stretch">
          <Heading size="xl">{t("Navigators")}</Heading>

          <Skeleton loading={overviewLoading}>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={2}>
              <StatTile
                icon={
                  <Icon boxSize={{ base: 4, md: 4 }} color="text.subtle">
                    <LuCompass />
                  </Icon>
                }
                value={overview?.activeNavigators ?? 0}
                label={t("Active")}
              />
              <StatTile
                icon={
                  <Icon boxSize={{ base: 4, md: 4 }} color="text.subtle">
                    <LuUsers />
                  </Icon>
                }
                value={overview?.totalCitizens ?? 0}
                label={t("Citizens")}
              />
              <StatTile
                icon={
                  <Icon boxSize={{ base: 4, md: 5 }}>
                    <B3trSvg />
                  </Icon>
                }
                value={overview ? formatter.format(Number(overview.totalStakedFormatted)) : "0"}
                label={t("B3TR staked")}
              />
              <StatTile
                icon={<Icon as={Vot3Svg} boxSize={{ base: 4, md: 5 }} color="text.subtle" />}
                value={overview ? formatter.format(Number(overview.totalDelegatedFormatted)) : "0"}
                label={t("VOT3 delegated")}
              />
            </SimpleGrid>
          </Skeleton>

          {newestNavigators && newestNavigators.length > 0 && (
            <Skeleton loading={newestLoading}>
              <VStack gap={2} align="stretch">
                <Text
                  textStyle="xxs"
                  color="text.subtle"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wider">
                  {t("Recently joined")}
                </Text>
                {newestNavigators.slice(0, 3).map(nav => (
                  <NavigatorRow key={nav.address} nav={nav} />
                ))}
              </VStack>
            </Skeleton>
          )}

          <Button variant="outline" size="sm" w="full" onClick={() => router.push("/navigators")}>
            {t("Explore Navigators")}
          </Button>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

const StatTile = ({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) => (
  <VStack gap={1} align="start" p={3} bg="bg.secondary" borderRadius="lg">
    <Stack direction={{ base: "column", md: "row" }} gap={{ base: 1, md: 2 }} align={{ base: "start", md: "center" }}>
      {icon}
      <Text textStyle="lg" fontWeight="bold">
        {value}
      </Text>
    </Stack>
    <Text textStyle="xs" color="text.subtle" lineClamp={1}>
      {label}
    </Text>
  </VStack>
)

const NavigatorRow = ({ nav }: { nav: NavigatorEntityFormatted }) => {
  const router = useRouter()
  const { data: domainData } = useVechainDomain(nav.address)
  const { data: metadata } = useNavigatorMetadata(nav.metadataURI)

  const displayName = domainData?.domain ? humanDomain(domainData.domain, 12, 8) : humanAddress(nav.address, 6, 4)

  return (
    <HStack
      gap={3}
      p={2}
      borderRadius="lg"
      border="sm"
      borderColor="border.secondary"
      cursor="pointer"
      _hover={{ bg: "bg.subtle" }}
      onClick={() => router.push(`/navigators/${nav.address}`)}>
      <AddressIcon address={nav.address} boxSize={8} borderRadius="full" />
      <VStack gap={0} align="start" flex={1}>
        <Text textStyle="sm" fontWeight="semibold">
          {displayName}
        </Text>
        {metadata?.votingStrategy && (
          <Text textStyle="xs" color="text.subtle" lineClamp={1}>
            {metadata.votingStrategy}
          </Text>
        )}
      </VStack>
      <HStack gap={1}>
        <Icon boxSize={3} color="text.subtle">
          <LuUsers />
        </Icon>
        <Text textStyle="xs" color="text.subtle">
          {nav.citizenCount}
        </Text>
      </HStack>
    </HStack>
  )
}

"use client"

import { Button, Card, Heading, HStack, Icon, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
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
import { useNavigatorDisplayName } from "@/hooks/useNavigatorDisplayName"

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
  if (!overviewLoading && !overview?.activeNavigators) return null

  return (
    <Card.Root w="full" variant="primary">
      <Card.Body>
        <VStack gap={4} align="stretch">
          <Heading size="xl">{t("Navigators")}</Heading>

          <Skeleton loading={overviewLoading}>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 4, md: 8 }}>
              <StatTile
                icon={<Icon as={LuCompass} boxSize={4} color="brand.secondary" />}
                value={overview?.activeNavigators ?? 0}
                label={t("Active")}
              />
              <StatTile
                icon={<Icon as={LuUsers} boxSize={4} color="brand.secondary" />}
                value={overview?.totalCitizens ?? 0}
                label={t("Citizens")}
              />
              <StatTile
                icon={<Icon as={B3trSvg} boxSize={6} color="brand.secondary" />}
                value={overview ? formatter.format(Number(overview.totalStakedFormatted)) : "0"}
                label={t("B3TR staked")}
              />
              <StatTile
                icon={<Icon as={Vot3Svg} boxSize={6} color="brand.secondary" />}
                value={overview ? formatter.format(Number(overview.totalDelegatedFormatted)) : "0"}
                label={t("VOT3 delegated")}
              />
            </SimpleGrid>
          </Skeleton>

          {newestNavigators && newestNavigators.length > 0 && (
            <Skeleton loading={newestLoading}>
              <VStack gap={2} mt={4} align="stretch">
                <Heading size="sm" fontWeight="semibold">
                  {t("Recently joined")}
                </Heading>
                {newestNavigators.slice(0, 3).map(nav => (
                  <NavigatorRow key={nav.address} nav={nav} />
                ))}
              </VStack>
            </Skeleton>
          )}
        </VStack>
      </Card.Body>
      <Card.Footer justifyContent="center" mt={5}>
        <Button variant="secondary" onClick={() => router.push("/navigators")}>
          <LuCompass />
          {t("Explore Navigators")}
        </Button>
      </Card.Footer>
    </Card.Root>
  )
}

const StatTile = ({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) => (
  <VStack align="flex-start" gap={1}>
    <HStack>
      {icon}
      <Heading size="xl">{value}</Heading>
    </HStack>
    <Text textStyle={["xs", "sm"]} color="text.subtle">
      {label}
    </Text>
  </VStack>
)

const NavigatorRow = ({ nav }: { nav: NavigatorEntityFormatted }) => {
  const router = useRouter()
  const { displayName } = useNavigatorDisplayName(nav.address, {
    domainPrefix: 12,
    domainSuffix: 8,
    addressPrefix: 6,
    addressSuffix: 4,
  })
  const { data: metadata } = useNavigatorMetadata(nav.metadataURI)

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

"use client"

import { Box, Button, Card, Flex, Heading, HStack, Image, LinkBox, Skeleton, Text, VStack } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { formatUnits } from "viem"

import { useGetB3TRtoUpgradeToLevel } from "@/api/contracts/galaxyMember/hooks/useGetB3TRtoUpgradeToLevel"
import { AddressIcon } from "@/components/AddressIcon"
import { gmNfts } from "@/constants/gmNfts"
import { type GmUpgradeEntry } from "@/hooks/activities/useAllGmUpgrades"
import { useGmUpgradesPaginated } from "@/hooks/activities/useGmUpgradesPaginated"

const GM_UPGRADE_ROW_SUFFIX_KEY = "upgraded to {{level}} donating {{amount}} B3TR"

const getLevelName = (level: number): string => gmNfts.find(n => n.level === String(level))?.name ?? `Level ${level}`

const getLevelImage = (level: number): string | undefined => gmNfts.find(n => n.level === String(level))?.image

const LEVEL_IMG_SIZE_BASE = 36
const LEVEL_IMG_SIZE_MD = 50
const LEVEL_OFFSET_X = 6
const LEVEL_OFFSET_Y = 4

const LevelStack: React.FC<{ oldLevel: number; newLevel: number }> = ({ oldLevel, newLevel }) => {
  const oldSrc = getLevelImage(oldLevel)
  const newSrc = getLevelImage(newLevel)
  const images = [newSrc, oldSrc].filter(Boolean) as string[]
  const totalItems = images.length

  return (
    <Box
      position="relative"
      isolation="isolate"
      w={{
        base: `${LEVEL_IMG_SIZE_BASE + (totalItems - 1) * LEVEL_OFFSET_X}px`,
        md: `${LEVEL_IMG_SIZE_MD + (totalItems - 1) * LEVEL_OFFSET_X}px`,
      }}
      h={{
        base: `${LEVEL_IMG_SIZE_BASE + (totalItems - 1) * LEVEL_OFFSET_Y}px`,
        md: `${LEVEL_IMG_SIZE_MD + (totalItems - 1) * LEVEL_OFFSET_Y}px`,
      }}
      flexShrink={0}>
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          position="absolute"
          top={{ base: `${i * LEVEL_OFFSET_Y}px`, md: `${i * LEVEL_OFFSET_Y}px` }}
          left={{ base: `${i * LEVEL_OFFSET_X}px`, md: `${i * LEVEL_OFFSET_X}px` }}
          w={{ base: `${LEVEL_IMG_SIZE_BASE}px`, md: `${LEVEL_IMG_SIZE_MD}px` }}
          h={{ base: `${LEVEL_IMG_SIZE_BASE}px`, md: `${LEVEL_IMG_SIZE_MD}px` }}
          objectFit="cover"
          rounded="md"
          borderWidth="1px"
          borderColor="border.secondary"
          bg="bg.subtle"
          zIndex={totalItems - i}
        />
      ))}
    </Box>
  )
}

const UpgradeRow: React.FC<{ upgrade: GmUpgradeEntry }> = ({ upgrade }) => {
  const { t } = useTranslation()
  const { userAddress, oldLevel, newLevel, timestamp } = upgrade
  const { data: vnsData } = useVechainDomain(userAddress)
  const domain = vnsData?.domain
  const displayName = domain ? humanDomain(domain, 4, 26) : humanAddress(userAddress, 6, 3)
  const { data: b3trRaw, isLoading } = useGetB3TRtoUpgradeToLevel(newLevel)
  const amountDisplay = isLoading ? "..." : b3trRaw != null ? Number(formatUnits(b3trRaw, 18)).toLocaleString() : ""
  const messageSuffix = t(GM_UPGRADE_ROW_SUFFIX_KEY, {
    level: getLevelName(newLevel),
    amount: amountDisplay,
  })

  return (
    <>
      <Flex w="full" direction="row" gap={3} align="center" p={3} rounded="lg" display={{ base: "flex", md: "none" }}>
        <VStack align="stretch" gap={0.5} flex="1" minW="0">
          <HStack gap="2" align="flex-start" wrap="wrap">
            <LinkBox asChild display="flex" alignItems="center" flexShrink={0} _hover={{ opacity: 0.9 }}>
              <NextLink href="/galaxy-member">
                <HStack gap="2" align="center">
                  <AddressIcon address={userAddress} rounded="full" h="7" w="7" flexShrink={0} />
                  <Text as="span" textStyle="sm" fontWeight="medium">
                    {displayName}
                  </Text>
                </HStack>
              </NextLink>
            </LinkBox>
            <Text textStyle="sm" color="text.subtle" lineClamp={2}>
              {messageSuffix}
            </Text>
          </HStack>
          <Text textStyle="xs" color="text.subtle">
            {dayjs.unix(timestamp).fromNow()}
          </Text>
        </VStack>
        <LevelStack oldLevel={oldLevel} newLevel={newLevel} />
      </Flex>
      <Flex w="full" direction="row" gap={3} align="center" p={3} rounded="lg" display={{ base: "none", md: "flex" }}>
        <LevelStack oldLevel={oldLevel} newLevel={newLevel} />
        <LinkBox asChild display="flex" alignItems="center" flexShrink={0} _hover={{ opacity: 0.9 }}>
          <NextLink href="/galaxy-member">
            <HStack gap="2" align="center">
              <AddressIcon address={userAddress} rounded="full" h="8" w="8" flexShrink={0} />
              <Text textStyle="sm" fontWeight="medium" lineClamp={1}>
                {displayName}
              </Text>
            </HStack>
          </NextLink>
        </LinkBox>
        <Text textStyle="sm" color="text.subtle" flex="1 1 0" minW="0" lineClamp={1}>
          {messageSuffix}
        </Text>
        <Text textStyle="xs" color="text.subtle" flexShrink={0}>
          {dayjs.unix(timestamp).fromNow()}
        </Text>
      </Flex>
    </>
  )
}

export const GmUpgradesActivityList: React.FC = () => {
  const { t } = useTranslation()
  const { data: upgrades, hasMore, loadMore, isLoading } = useGmUpgradesPaginated()

  if (isLoading && upgrades.length === 0) {
    return (
      <Card.Root variant="primary" maxH="fit-content">
        <Card.Header>
          <VStack align="stretch" gap={1}>
            <Skeleton height="7" width="50%" />
            <Skeleton height="4" width="80%" />
          </VStack>
        </Card.Header>
        <Card.Body>
          <VStack gap="3" align="stretch">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} height="14" width="full" rounded="lg" />
            ))}
          </VStack>
        </Card.Body>
      </Card.Root>
    )
  }

  if (!upgrades.length) return null

  return (
    <Card.Root variant="primary" maxH="fit-content">
      <Card.Header>
        <VStack align="stretch" gap={1}>
          <Heading textStyle="lg">{t("Recent GM upgrades")}</Heading>
          <Text textStyle="sm" color="text.subtle">
            {t("Recent upgrades from the community.")}
          </Text>
        </VStack>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap="3">
          {upgrades.map(upgrade => (
            <UpgradeRow key={`${upgrade.userAddress}-${upgrade.tokenId}-${upgrade.timestamp}`} upgrade={upgrade} />
          ))}
          {hasMore && (
            <Button variant="ghost" size="sm" onClick={loadMore} w="full">
              {t("Load more")}
            </Button>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

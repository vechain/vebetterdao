import {
  Button,
  Card,
  Collapsible,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  VStack,
  Text,
  Icon,
  useDisclosure,
} from "@chakra-ui/react"
import { UilCalculatorAlt, UilInfoCircle } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronDown } from "react-icons/fa6"

import { ToggleTip } from "@/components/ui/toggle-tip"
import { gmNfts } from "@/constants/gmNfts"

import { UserGM, useGetUserGMs } from "../../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useGMMaxLevel } from "../../../../../api/contracts/galaxyMember/hooks/useGMMaxLevel"
import { getLevelGradient } from "../../../../../api/contracts/galaxyMember/utils/getLevelGradient"
import { useGMLevelsOverview } from "../../../../../api/indexer/gm/useGMLevelsOverview"

import { RewardsCalculatorModal } from "./RewardsCalculatorModal"

const compactFormatter = getCompactFormatter(0)

const TRANSITION_DURATION = "0.5s"

const LevelRow = ({
  gmNft,
  isCurrentLevel,
  levelText,
  tokenLevel,
  holderCount,
}: {
  gmNft: (typeof gmNfts)[number]
  isCurrentLevel: boolean
  levelText: string
  tokenLevel: string
  holderCount?: number
}) => {
  const { t } = useTranslation()

  return (
    <HStack justify="space-between" opacity={isCurrentLevel ? 1 : 0.6}>
      <HStack gap="4">
        <Flex position="relative" w="10" h="10" rounded="full" overflow="hidden">
          <Image src={gmNft.image} alt={gmNft.name} w="10" h="10" position="absolute" />
          <Flex w="full" h="full" align="center" justify="center" bg="rgba(0, 0, 0, 0.2)" zIndex={1}>
            <Text textStyle="md" color="white">
              {gmNft.level}
            </Text>
          </Flex>
        </Flex>
        <VStack align="stretch" gap={0}>
          <Text textStyle="lg" fontWeight="semibold">
            {gmNft.name}
          </Text>
          <HStack gap={2}>
            {levelText && (
              <Text textStyle="sm" color="text.subtle">
                {levelText}
              </Text>
            )}
            {holderCount !== undefined && (
              <Text textStyle="sm" color="text.subtle">
                {levelText ? "·" : ""} {compactFormatter.format(holderCount)} {t("holders")}
              </Text>
            )}
          </HStack>
        </VStack>
      </HStack>
      {isCurrentLevel ? (
        <Heading
          textStyle="2xl"
          bg={getLevelGradient(Number(tokenLevel))}
          style={{
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
          {gmNft.multiplier}
        </Heading>
      ) : (
        <Text textStyle="lg" color="text.subtle">
          {gmNft.multiplier}
        </Text>
      )}
    </HStack>
  )
}

export const GalaxyLevelsCard = () => {
  const { data: userGms } = useGetUserGMs()
  const { data: maxGMLevel = 0 } = useGMMaxLevel()
  const { data: levelsOverview } = useGMLevelsOverview()
  const { tokenLevel } = userGms?.find(gm => gm.isSelected) || ({ tokenLevel: "0" } as UserGM)
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const { open: isCalcOpen, onOpen: onCalcOpen, onClose: onCalcClose } = useDisclosure()

  const holderCountByName = useMemo(() => {
    if (!levelsOverview) return {}
    return Object.fromEntries(levelsOverview.map(({ level, totalNFTs }) => [level.toLowerCase(), totalNFTs]))
  }, [levelsOverview])

  const allLevels = useMemo(() => gmNfts.slice(0, maxGMLevel), [maxGMLevel])

  const visibleLevels = useMemo(() => {
    const level = Number(tokenLevel)
    if (level === 1) return gmNfts.slice(0, Math.min(4, maxGMLevel))
    if (level >= 2 && level <= maxGMLevel - 2) return gmNfts.slice(level - 1, Math.min(level + 3, maxGMLevel))
    if (level === maxGMLevel - 1) return gmNfts.slice(Math.max(0, maxGMLevel - 5), maxGMLevel - 1)
    return gmNfts.slice(Math.max(0, maxGMLevel - 4), maxGMLevel)
  }, [tokenLevel, maxGMLevel])

  const { beforeLevels, afterLevels, hasHiddenLevels } = useMemo(() => {
    if (!visibleLevels.length || !allLevels.length) return { beforeLevels: [], afterLevels: [], hasHiddenLevels: false }

    const firstVisibleIdx = allLevels.findIndex(l => l.level === visibleLevels[0]?.level)
    const lastVisibleIdx = allLevels.findIndex(l => l.level === visibleLevels[visibleLevels.length - 1]?.level)

    const before = firstVisibleIdx > 0 ? allLevels.slice(0, firstVisibleIdx) : []
    const after = lastVisibleIdx < allLevels.length - 1 ? allLevels.slice(lastVisibleIdx + 1) : []

    return {
      beforeLevels: before,
      afterLevels: after,
      hasHiddenLevels: before.length > 0 || after.length > 0,
    }
  }, [visibleLevels, allLevels])

  const handleToggle = useCallback(() => setIsExpanded(prev => !prev), [])

  const getLevelText = (level: number, maxLevel: number, currentLevel: number) => {
    if (level === maxLevel) return t("Max Level")
    if (level === 1 || level <= currentLevel) return ""
    return t("{{b3trToUpgrade}} B3TR to upgrade", {
      b3trToUpgrade: compactFormatter.format(gmNfts[level - 1]?.b3trToUpgrade ?? 0),
    })
  }

  const renderLevelRow = (gmNft: (typeof gmNfts)[number]) => (
    <LevelRow
      key={gmNft.level}
      gmNft={gmNft}
      isCurrentLevel={gmNft.level === tokenLevel}
      levelText={getLevelText(Number(gmNft.level), maxGMLevel, Number(tokenLevel))}
      tokenLevel={tokenLevel}
      holderCount={holderCountByName[gmNft.name.toLowerCase()]}
    />
  )

  return (
    <>
      <Card.Root variant="primary">
        <Card.Body>
          <VStack align="stretch" gap={0}>
            <VStack align="stretch" mb={6}>
              <HStack justify="space-between">
                <Heading textStyle="lg">{t("Reward Weight")}</Heading>
                <ToggleTip
                  contentProps={{ p: "0.25rem 0.5rem" }}
                  content={
                    <VStack maxW="280px" maxH="400px" overflowY="auto" align="stretch" gap={2}>
                      <SimpleGrid
                        alignItems="center"
                        columns={3}
                        gap={2}
                        py={2}
                        borderBottom="1px solid"
                        borderColor="border.emphasized">
                        <Text textStyle="sm" fontWeight="bold">
                          {t("Name")}
                        </Text>
                        <Text textStyle="sm" fontWeight="bold">
                          {t("Reward Weight")}
                        </Text>
                        <Text textStyle="sm" fontWeight="bold">
                          {t("Cost")}
                        </Text>
                      </SimpleGrid>
                      {gmNfts.map(nft => (
                        <SimpleGrid key={nft.level} alignItems="center" columns={3} gap={2} py={2}>
                          <Text textStyle="sm" fontWeight="bold">
                            {nft.name}
                          </Text>
                          <Text textStyle="sm">{nft.multiplier}</Text>
                          <Text textStyle="sm">{compactFormatter.format(nft.b3trToUpgrade)}</Text>
                        </SimpleGrid>
                      ))}
                    </VStack>
                  }>
                  <Button size="xs" variant="ghost">
                    <Icon as={UilInfoCircle} color="actions.primary.default" />
                  </Button>
                </ToggleTip>
              </HStack>
              <Text textStyle="sm" color="text.subtle">
                {t(
                  "The higher your GM level, the greater your share of the GM Rewards Pool (5% of weekly B3TR emissions). Upgrade by burning B3TR or by attaching a VeChain Node for a free boost.",
                )}
              </Text>
            </VStack>

            {beforeLevels.length > 0 && (
              <Collapsible.Root open={isExpanded}>
                <Collapsible.Content css={{ transition: `height ${TRANSITION_DURATION} ease` }}>
                  <VStack align="stretch" gap={6} mb={6}>
                    {beforeLevels.map(renderLevelRow)}
                  </VStack>
                </Collapsible.Content>
              </Collapsible.Root>
            )}

            <VStack align="stretch" gap={6}>
              {visibleLevels.map(renderLevelRow)}
            </VStack>

            {afterLevels.length > 0 && (
              <Collapsible.Root open={isExpanded}>
                <Collapsible.Content css={{ transition: `height ${TRANSITION_DURATION} ease` }}>
                  <VStack align="stretch" gap={6} mt={6}>
                    {afterLevels.map(renderLevelRow)}
                  </VStack>
                </Collapsible.Content>
              </Collapsible.Root>
            )}
          </VStack>
        </Card.Body>

        <Card.Footer flexDir="column" gap={3}>
          {hasHiddenLevels && (
            <Button
              variant="ghost"
              w="full"
              onClick={handleToggle}
              py={1}
              color="text.subtle"
              _hover={{ color: "text.default" }}
              transition="color 0.2s"
              aria-expanded={isExpanded}>
              <Icon
                as={FaChevronDown}
                boxSize={3}
                transition="transform 0.3s ease"
                transform={isExpanded ? "rotate(180deg)" : undefined}
              />
              <Text textStyle="sm">{isExpanded ? t("Show less") : t("See all levels")}</Text>
            </Button>
          )}
          <Button onClick={onCalcOpen} variant="secondary" w="full">
            <Icon as={UilCalculatorAlt} />
            {t("Estimate Rewards")}
          </Button>
        </Card.Footer>
      </Card.Root>
      <RewardsCalculatorModal isOpen={isCalcOpen} onClose={onCalcClose} />
    </>
  )
}

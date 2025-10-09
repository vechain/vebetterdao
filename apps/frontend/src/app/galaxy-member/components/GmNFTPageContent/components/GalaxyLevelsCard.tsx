import { useGetUserGMs, useGMMaxLevel, UserGM } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { ToggleTip } from "@/components/ui/toggle-tip"
import { gmNfts } from "@/constants/gmNfts"
import { Button, Card, Flex, Heading, HStack, Image, SimpleGrid, VStack, Text, Icon } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(0)

export const GalaxyLevelsCard = () => {
  const { data: userGms } = useGetUserGMs()
  const { data: maxGMLevel = 0 } = useGMMaxLevel()
  const { tokenLevel } = userGms?.find(gm => gm.isSelected) || ({ tokenLevel: "0" } as UserGM)
  const { t } = useTranslation()
  const [showShortened, setShowShortened] = useState(false)
  const gmNftsShortened = useMemo(() => {
    const level = Number(tokenLevel)
    if (level === 1) {
      return gmNfts.slice(0, Math.min(4, maxGMLevel))
    }
    if (level >= 2 && level <= maxGMLevel - 2) {
      return gmNfts.slice(level - 1, Math.min(level + 3, maxGMLevel))
    }
    if (level === maxGMLevel - 1) {
      return gmNfts.slice(maxGMLevel - 5, maxGMLevel - 1)
    }
    return gmNfts.slice(maxGMLevel - 4, maxGMLevel)
  }, [tokenLevel, maxGMLevel])

  const getLevelText = (level: number, maxLevel: number, currentLevel: number) => {
    if (level === maxLevel) {
      return t("Max Level")
    }
    if (level === 1 || level <= currentLevel) {
      return ""
    }
    return t("{{b3trToUpgrade}} B3TR to upgrade", {
      b3trToUpgrade: compactFormatter.format(gmNfts[level - 1]?.b3trToUpgrade ?? 0),
    })
  }

  return (
    <Card.Root variant="primary">
      <Card.Body>
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading textStyle="lg">{t("Reward Weight")}</Heading>
              <ToggleTip
                contentProps={{
                  p: "0.25rem 0.5rem",
                }}
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
                  <Icon as={UilInfoCircle} color="actions.tertiary.default" />
                </Button>
              </ToggleTip>
            </HStack>
            <Text textStyle="sm" color="text.subtle">
              {t("Earn enough B3TR to upgrade your level and get additional rewards for all your voting rewards!")}
            </Text>
          </VStack>
          {(showShortened ? gmNftsShortened : gmNfts.slice(0, maxGMLevel)).map(gmNft => {
            const isCurrentLevel = gmNft.level === tokenLevel
            return (
              <HStack key={gmNft.level} justify="space-between" opacity={isCurrentLevel ? 1 : 0.6}>
                <HStack gap="4">
                  <Flex position="relative" w="10" h="10" rounded="full" overflow={"hidden"}>
                    <Image src={gmNft.image} alt={gmNft.name} w="10" h="10" position={"absolute"} />
                    <Flex w="full" h="full" align="center" justify="center" bg={"rgba(0, 0, 0, 0.2)"} zIndex={1}>
                      <Text textStyle="md" color="white">
                        {gmNft.level}
                      </Text>
                    </Flex>
                  </Flex>
                  <VStack align="stretch" gap={0}>
                    <Text textStyle="lg" fontWeight="semibold">
                      {gmNft.name}
                    </Text>
                    <Text textStyle="sm" color="text.subtle">
                      {getLevelText(Number(gmNft.level), maxGMLevel, Number(tokenLevel))}
                    </Text>
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
          })}
          {showShortened && gmNfts.slice(0, maxGMLevel).length > gmNftsShortened.length && (
            <Button
              variant="plain"
              color="actions.tertiary.default"
              onClick={() => setShowShortened(false)}
              textStyle="lg">
              {t("See all levels")}
            </Button>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

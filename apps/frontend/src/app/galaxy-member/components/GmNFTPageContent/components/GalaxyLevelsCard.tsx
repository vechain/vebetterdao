import { useSelectedGmNft } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { BaseTooltip } from "@/components"
import { gmNfts } from "@/constants/gmNfts"
import { Button, Card, Flex, Heading, HStack, Image, Table, VStack, Text } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(0)

export const GalaxyLevelsCard = () => {
  const { gmLevel, maxGmLevel = 0 } = useSelectedGmNft()
  const { t } = useTranslation()
  const [showShortened, setShowShortened] = useState(false)
  const gmNftsShortened = useMemo(() => {
    const level = Number(gmLevel)
    if (level === 1) {
      return gmNfts.slice(0, Math.min(4, maxGmLevel))
    }
    if (level >= 2 && level <= maxGmLevel - 2) {
      return gmNfts.slice(level - 1, Math.min(level + 3, maxGmLevel))
    }
    if (level === maxGmLevel - 1) {
      return gmNfts.slice(maxGmLevel - 5, maxGmLevel - 1)
    }
    return gmNfts.slice(maxGmLevel - 4, maxGmLevel)
  }, [gmLevel, maxGmLevel])

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
    <Card.Root variant="baseWithBorder">
      <Card.Body>
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="lg">{t("Reward Weight")}</Heading>
              <BaseTooltip
                text={
                  <Table.ScrollArea maxW="280px" maxH="400px" overflowY="auto">
                    <Table.Root variant="line" size="sm">
                      <Table.Header position="sticky" top={0}>
                        <Table.Row>
                          <Table.ColumnHeader color="white" py={2}>
                            {t("Name")}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color="white" py={2}>
                            {t("Reward Weight")}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color="white" py={2}>
                            {t("Cost")}
                          </Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {gmNfts.map(nft => (
                          <Table.Row key={nft.level} p={0}>
                            <Table.Cell py={2}>{nft.name}</Table.Cell>
                            <Table.Cell py={2}>{nft.multiplier}</Table.Cell>
                            <Table.Cell py={2}>{compactFormatter.format(nft.b3trToUpgrade)}</Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Table.ScrollArea>
                }>
                <span>
                  <UilInfoCircle color="#004CFC" />
                </span>
              </BaseTooltip>
            </HStack>
            <Text fontSize="sm" color="#6A6A6A">
              {t("Earn enough B3TR to upgrade your level and get additional rewards for all your voting rewards!")}
            </Text>
          </VStack>
          {(showShortened ? gmNftsShortened : gmNfts.slice(0, maxGmLevel)).map(gmNft => {
            const isCurrentLevel = gmNft.level === gmLevel
            return (
              <HStack key={gmNft.level} justify="space-between" opacity={isCurrentLevel ? 1 : 0.6}>
                <HStack gap="4">
                  <Flex position="relative" w="10" h="10" rounded="full" overflow={"hidden"}>
                    <Image src={gmNft.image} alt={gmNft.name} w="10" h="10" position={"absolute"} />
                    <Flex w="full" h="full" align="center" justify="center" bg={"rgba(0, 0, 0, 0.2)"} zIndex={1}>
                      <Text fontSize="md" color="#FFFFFF" fontWeight={700}>
                        {gmNft.level}
                      </Text>
                    </Flex>
                  </Flex>
                  <VStack align="stretch" gap={0}>
                    <Text fontSize="lg" fontWeight={"600"}>
                      {gmNft.name}
                    </Text>
                    <Text fontSize="sm" color="#6A6A6A">
                      {getLevelText(Number(gmNft.level), maxGmLevel, Number(gmLevel))}
                    </Text>
                  </VStack>
                </HStack>
                {isCurrentLevel ? (
                  <Heading
                    fontSize="2xl"
                    bg={getLevelGradient(Number(gmLevel))}
                    style={{
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                    {gmNft.multiplier}
                  </Heading>
                ) : (
                  <Text fontSize="lg" color="#6A6A6A">
                    {gmNft.multiplier}
                  </Text>
                )}
              </HStack>
            )
          })}
          {showShortened && gmNfts.slice(0, maxGmLevel).length > gmNftsShortened.length && (
            <Button variant={"primaryLink"} onClick={() => setShowShortened(false)} fontSize="lg">
              {t("See all levels")}
            </Button>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

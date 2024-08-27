import { useSelectedGmNft } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { gmNfts } from "@/constants/gmNfts"
import { Button, Card, CardBody, Flex, Heading, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const GalaxyLevelsCard = () => {
  const { gmLevel } = useSelectedGmNft()
  const { t } = useTranslation()
  const [showShortened, setShowShortened] = useState(true)
  const gmNftsShortened = useMemo(() => {
    const level = Number(gmLevel)
    if (level === 1) {
      return gmNfts.slice(0, 4)
    }
    if (level >= 2 && level <= 8) {
      return gmNfts.slice(level - 1, level + 3)
    }
    if (level === 9) {
      return gmNfts.slice(5, 9)
    }
    return gmNfts.slice(6, 10)
  }, [gmLevel])

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <Heading fontSize="lg">{t("Galaxy Levels")}</Heading>
            <Text fontSize="sm" color="#6A6A6A">
              {t("Earn enough B3TR to upgrade your level and get multipliers for all your voting rewards!")}
            </Text>
          </VStack>
          {(showShortened ? gmNftsShortened : gmNfts).map(gmNft => {
            const isCurrentLevel = gmNft.level === gmLevel
            return (
              <HStack key={gmNft.level} justify="space-between">
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
                      {gmNft.level === "9"
                        ? t("Max Level")
                        : t("{{b3trToUpgrade}} B3TR to upgrade", { b3trToUpgrade: gmNft.b3trToUpgrade })}
                    </Text>
                  </VStack>
                </HStack>
                {isCurrentLevel ? (
                  <Heading
                    fontSize="2xl"
                    bg={getLevelGradient(gmLevel)}
                    style={{
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                    {gmNft.multiplier}
                    {"x"}
                  </Heading>
                ) : (
                  <Text fontSize="lg" color="#6A6A6A">
                    {gmNft.multiplier}
                    {"x"}
                  </Text>
                )}
              </HStack>
            )
          })}
          {showShortened && (
            <Button variant={"primaryLink"} onClick={() => setShowShortened(false)} fontSize="lg">
              {t("See all levels")}
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

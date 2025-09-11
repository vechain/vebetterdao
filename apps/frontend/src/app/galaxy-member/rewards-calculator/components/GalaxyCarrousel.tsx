import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Box, Flex, IconButton, useBreakpointValue, Image, Text } from "@chakra-ui/react"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"
import { gmNfts } from "@/constants/gmNfts"
import { useTranslation } from "react-i18next"
import { useGMMaxLevel, UserGM } from "@/api"

type Props = {
  setSelectedGMLevel: (GMLevel: string) => void
  usersGM?: UserGM
}

export const GalaxyCarrousel = ({ setSelectedGMLevel, usersGM }: Props) => {
  const { t } = useTranslation()
  const { data: maxGmLevel } = useGMMaxLevel()

  const upgradableNfts = useMemo(() => {
    return gmNfts.filter(
      nft => parseInt(nft.level, 10) >= Number(usersGM?.tokenLevel) && parseInt(nft.level, 10) <= Number(maxGmLevel),
    )
  }, [usersGM?.tokenLevel, maxGmLevel])

  const visibleCards = useBreakpointValue({ base: 3, md: 3, lg: 3 }) || 1
  const initialIndex = upgradableNfts.findIndex(nft => nft.level === usersGM?.tokenLevel)
  const [currentIndex, setCurrentIndex] = useState(initialIndex !== -1 ? initialIndex - 1 : 0)
  const [centeredNFT, setCenteredNFT] = useState<string | undefined>(usersGM?.tokenLevel)

  const getVisibleNFTs = useCallback(() => {
    const visibleNFTs = []
    const totalNFTs = upgradableNfts.length

    const normalizedIndex = ((currentIndex % totalNFTs) + totalNFTs) % totalNFTs
    for (let i = 0; i < Math.min(visibleCards, totalNFTs); i++) {
      const index = (normalizedIndex + i) % totalNFTs
      visibleNFTs.push(upgradableNfts[index])
    }
    return visibleNFTs
  }, [currentIndex, visibleCards, upgradableNfts])

  const handleSelect = useCallback(
    (GMLevel: string) => {
      setSelectedGMLevel(GMLevel)
    },
    [setSelectedGMLevel],
  )

  const nextCard = () => {
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex + 1
      return nextIndex >= upgradableNfts.length ? 0 : nextIndex
    })
  }

  const prevCard = () => {
    const visibleNFTs = getVisibleNFTs()
    const prevIndex = (currentIndex - 1 + upgradableNfts.length) % upgradableNfts.length
    setCurrentIndex(prevIndex)

    const centeredIndex = Math.floor(visibleCards / 2)
    const newLevel = visibleNFTs[centeredIndex]?.level
    if (newLevel) {
      setCenteredNFT(newLevel)
      handleSelect(newLevel)
    }
  }

  useEffect(() => {
    const visibleNFTs = getVisibleNFTs()
    const centeredIndex = Math.floor(visibleCards / 2)
    if (visibleNFTs[centeredIndex]) {
      setCenteredNFT(visibleNFTs[centeredIndex]?.level)
    }
  }, [currentIndex, visibleCards, getVisibleNFTs])

  useEffect(() => {
    if (centeredNFT) {
      handleSelect(centeredNFT)
    }
  }, [centeredNFT, handleSelect])

  return (
    <Box position="relative">
      <Flex justify="center" align="center">
        {getVisibleNFTs().map(
          (nft, index) =>
            nft && (
              <Box
                key={nft.level}
                w={{ base: "120px", md: "150px", lg: "180px" }}
                h={{ base: "120px", md: "150px", lg: "180px" }}
                transform={index === Math.floor(visibleCards / 2) ? "scale(1.3)" : "scale(0.8)"}
                transformOrigin="center"
                transition="all 0.3s ease"
                onClick={() => {
                  if (index === Math.floor(visibleCards / 2)) {
                    handleSelect(nft.level)
                  }
                }}
                alignContent={"center"}
                cursor="pointer">
                <Flex direction="column" alignItems="center">
                  <Text fontSize="xl" fontWeight="bold" color="white">
                    {t("{{name}}", { name: nft.name })}
                  </Text>
                  <Image
                    w={{ base: "100px", md: "130px", lg: "160px" }}
                    h={{ base: "100px", md: "130px", lg: "160px" }}
                    src={nft.image}
                    alt={nft.name}
                    objectFit="contain"
                    borderRadius="20px"
                  />
                </Flex>
              </Box>
            ),
        )}
      </Flex>

      <Flex justify="center" align="center" mt={12} gap={4}>
        <IconButton
          aria-label="Previous card"
          onClick={prevCard}
          variant="solid"
          bg="white"
          color="black"
          size="sm"
          _hover={{ bg: "whiteAlpha.400" }}
          borderRadius="full">
          <FaChevronLeft size={16} />
        </IconButton>

        <Flex gap={2}>
          {upgradableNfts.map((nft, index) => {
            const adjustedIndex = index === 0 ? upgradableNfts.length - 1 : index - 1
            return (
              <Box
                key={`gm-level-${nft.level}`}
                w="2"
                h="2"
                borderRadius="full"
                bg={adjustedIndex === currentIndex ? "white" : "whiteAlpha.400"}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => setCurrentIndex(adjustedIndex)}
                _hover={{ transform: "scale(1.2)" }}
              />
            )
          })}
        </Flex>

        <IconButton
          aria-label="Next card"
          onClick={nextCard}
          variant="solid"
          bg="white"
          color="black"
          size="sm"
          _hover={{ bg: "whiteAlpha.400" }}
          borderRadius="full">
          <FaChevronRight size={16} />
        </IconButton>
      </Flex>
    </Box>
  )
}

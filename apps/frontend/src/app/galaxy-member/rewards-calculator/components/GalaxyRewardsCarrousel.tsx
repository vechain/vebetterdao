import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"

import { Box, Flex, IconButton, useBreakpointValue, Image, useMediaQuery, Text } from "@chakra-ui/react"
import { gmNfts } from "@/constants/gmNfts"

type Props = {
  selectedGMLevel: (GMLevel: number) => void
}

export const GalaxyRewardsCarrousel = ({ selectedGMLevel }: Props) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery("(min-width: 800px)")
  const [currentIndex, setCurrentIndex] = useState(0)
  const visibleCards = useBreakpointValue({ base: 1, md: 3, lg: 5 }) || 1

  const nextCard = () => {
    const newIndex = (currentIndex + 1) % gmNfts.length
    setCurrentIndex(newIndex)
    if (gmNfts[newIndex]) {
      selectedGMLevel(Number(gmNfts[newIndex].level)) // TODO: Find a way to uniform type ( avoiding casting)
    }
  }

  const prevCard = () => {
    const newIndex = (currentIndex - 1 + gmNfts.length) % gmNfts.length
    setCurrentIndex(newIndex)
    if (gmNfts[newIndex]) {
      selectedGMLevel(Number(gmNfts[newIndex].level)) // TODO: Find a way to uniform type ( avoiding casting)
    }
  }

  const getVisibleNFTs = () => {
    const visibleNFTs = []
    for (let i = 0; i < visibleCards; i++) {
      const index = (currentIndex + i) % gmNfts.length
      visibleNFTs.push(gmNfts[index])
    }
    return visibleNFTs
  }

  const handleSelect = (GMLevel: number) => {
    selectedGMLevel(GMLevel)
  }

  return (
    <Box position="relative" overflow="hidden" py={4} border={"1px solid black"}>
      <Flex
        alignItems="center"
        justifyContent="center"
        // border={"1px solid black"}
        height={{ base: "250px", md: "300px" }}>
        {getVisibleNFTs()
          .filter(nft => nft !== undefined)
          .map((nft, index) => (
            <Box
              key={nft?.level}
              width={{ base: "150px" }}
              height={{ base: "200px" }}
              margin="0 5px"
              position="relative"
              transform={index === Math.floor(visibleCards / 2) ? "scale(1.1)" : "scale(0.9)"}
              transition="all 0.3s ease"
              onClick={() => handleSelect(Number(nft.level))}
              cursor="pointer">
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                borderRadius="200px"
                background="linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)"
                border="1px solid rgba(255, 255, 255, 0.2)"
              />
              <Flex
                direction="column"
                alignItems="center"
                justifyContent="space-between"
                height="100%"
                position="relative"
                zIndex="1">
                <Text fontSize="md" fontWeight="bold">
                  {t("Level")} {nft?.level}
                </Text>
                <Image
                  src={nft?.image}
                  alt={nft?.name}
                  w={isAbove800 ? "300px" : "120px"}
                  h={isAbove800 ? "300px" : "120px"}
                  rounded="7px"
                  borderRadius="20px"
                />
                <Text fontSize="lg" fontWeight="bold">
                  {nft.name}
                </Text>
              </Flex>
            </Box>
          ))}
      </Flex>
      <Box display="flex" justifyContent="center" alignItems="center" position="relative">
        <IconButton
          aria-label="Previous card"
          icon={<FaChevronLeft />}
          alignSelf="center"
          transform="translateY(-50%)"
          onClick={prevCard}
          rounded="full"
          zIndex={2}
        />
        <IconButton
          aria-label="Next card"
          alignSelf="center"
          icon={<FaChevronRight />}
          transform="translateY(-50%)"
          onClick={nextCard}
          rounded="full"
          zIndex={2}
        />
      </Box>
    </Box>
  )
}

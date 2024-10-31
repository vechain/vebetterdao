import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"

import { Box, Flex, IconButton, useBreakpointValue, Image, useMediaQuery, Text } from "@chakra-ui/react"
import { gmNfts } from "@/constants/gmNfts"

type Props = {
  selectedGMLevel: (GMLevel: any) => void
}

export const GalaxyRewardsCarrousel = ({ selectedGMLevel }: Props) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery("(min-width: 800px)")
  const [currentIndex, setCurrentIndex] = useState(0)
  // TODO change the useBrakPoint with ChakraUI [ "", "", ""]
  const visibleCards = useBreakpointValue({ base: 1, md: 3, lg: 5 }) || 1

  const nextCard = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1 >= gmNfts.length ? 0 : prevIndex + 1))
  }

  const prevCard = () => {
    setCurrentIndex(prevIndex => (prevIndex - 1 < 0 ? gmNfts.length - 1 : prevIndex - 1))
  }

  const getVisibleNFTs = () => {
    const visibleNFTs = []
    for (let i = 0; i < visibleCards; i++) {
      const index = (currentIndex + i) % gmNfts.length
      console.log("index", index)
      visibleNFTs.push(gmNfts[index])
    }
    console.log("visibleNFTs", visibleNFTs)
    return visibleNFTs
  }

  const handleSelect = (GMLevel: any) => {
    selectedGMLevel(GMLevel)
  }

  return (
    <Box border={"1px solid black"}>
      <Flex alignItems="center" justifyContent="center" height={{ base: "300px", md: "400px" }}>
        {getVisibleNFTs().map((nft, index) => (
          <Box
            key={nft?.level}
            width={{ base: "200px", md: "250px" }}
            height={{ base: "250px", md: "300px" }}
            margin="0 10px"
            position="relative"
            transform={index === Math.floor(visibleCards / 2) ? "scale(1.1)" : "scale(0.9)"}
            transition="all 0.3s ease"
            // JUST MAKE SURE THAT nft.level = GMId ( normally yes but not sure about that)
            onClick={() => handleSelect(nft?.level)}
            cursor="pointer">
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              borderRadius="20px"
              background="linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)"
              border="1px solid rgba(255, 255, 255, 0.2)"
            />
            <Flex
              direction="column"
              alignItems="center"
              justifyContent="space-between"
              height="100%"
              padding="20px"
              position="relative"
              zIndex="1">
              <Text fontSize="lg" fontWeight="bold">
                {t("Level")} {nft?.level}
              </Text>
              <Image
                src={nft?.image}
                alt={nft?.name}
                w={isAbove800 ? "126px" : "64px"}
                h={isAbove800 ? "126px" : "64px"}
                rounded="7px"
                borderRadius="20px"
              />{" "}
              <Text fontSize="xl" fontWeight="bold">
                {nft?.name}
              </Text>
            </Flex>
          </Box>
        ))}
      </Flex>
      <IconButton
        aria-label="Previous card"
        icon={<FaChevronLeft />}
        position="absolute"
        left="10px"
        top="50%"
        transform="translateY(-50%)"
        onClick={prevCard}
        rounded="full"
      />
      <IconButton
        aria-label="Next card"
        icon={<FaChevronRight />}
        position="absolute"
        right="10px"
        top="50%"
        transform="translateY(-50%)"
        onClick={nextCard}
        rounded="full"
      />
    </Box>
  )
}

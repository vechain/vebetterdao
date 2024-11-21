import React, { useState, useEffect } from "react"
import { Box, Flex, IconButton, useBreakpointValue, Image, Text } from "@chakra-ui/react"

import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"
import { gmNfts } from "@/constants/gmNfts"
import { useTranslation } from "react-i18next"

type Props = {
  setSelectedGMLevel: (GMLevel: string | undefined) => void
}

export const GalaxyCarrousel = ({ setSelectedGMLevel }: Props) => {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [centeredNFT, setCenteredNFT] = useState<string | undefined>(undefined)
  const visibleCards = useBreakpointValue({ base: 3, md: 3, lg: 3 }) || 1

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
      visibleNFTs.push(gmNfts[index])
    }
    return visibleNFTs
  }

  const handleSelect = (GMLevel: string | undefined) => {
    setSelectedGMLevel(GMLevel)
  }

  useEffect(() => {
    if (centeredNFT) {
      handleSelect(centeredNFT)
    }
  }, [centeredNFT])

  // change the size when it's smaller device ( mobile, the caroussel should be bigger)
  return (
    <Box position="relative" overflow="hidden" w={"full"} h={"full"}>
      <Flex>
        {getVisibleNFTs().map((nft, index) => (
          <Box
            key={nft?.level}
            w={{ base: "100px", md: "300px", lg: "300px" }}
            h={{ base: "100px", md: "300px", lg: "300px" }}
            transform={index === Math.floor(visibleCards / 2) ? "scale(1.5)" : "scale(0.7)"}
            transformOrigin="center"
            transition="all 0.3s ease"
            onTransitionEnd={() => {
              if (index === Math.floor(visibleCards / 2)) {
                setCenteredNFT(nft?.level)
              }
            }}
            onClick={() => {
              if (index === Math.floor(visibleCards / 2)) {
                handleSelect(nft?.level)
              }
            }}
            alignContent={"center"}
            cursor="pointer">
            {nft ? (
              <Flex direction="column" alignItems="center">
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {t("{{name}}", { name: nft?.name })}
                </Text>

                <Image
                  w={{ base: "100px", md: "150px", lg: "150px" }}
                  h={{ base: "100px", md: "150px", lg: "150px" }}
                  src={nft?.image}
                  alt={nft?.name}
                  objectFit="contain"
                  borderRadius="20px"
                />
              </Flex>
            ) : (
              <Box
                w={{ base: "100px", md: "150px", lg: "150px" }}
                h={{ base: "100px", md: "150px", lg: "150px" }}
                borderRadius="20px"
                background="linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)"
                border="1px solid rgba(255, 255, 255, 0.2)"
                backdropFilter="blur(10px)"
              />
            )}
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
        colorScheme="whiteAlpha"
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
        colorScheme="whiteAlpha"
        rounded="full"
      />
    </Box>
  )
}

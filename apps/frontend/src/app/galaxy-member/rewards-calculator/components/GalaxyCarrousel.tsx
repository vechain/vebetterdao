import React, { useState, useEffect, useMemo } from "react"
import { Box, Flex, IconButton, useBreakpointValue, Image, Text } from "@chakra-ui/react"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"
import { gmNfts } from "@/constants/gmNfts"
import { useTranslation } from "react-i18next"

type Props = {
  setSelectedGMLevel: (GMLevel: string | undefined) => void
  usersGM: { gmLevel: any; gmId: any; b3trToUpgradeGMToNextLevel: any }
}

export const GalaxyCarrousel = ({ setSelectedGMLevel, usersGM }: Props) => {
  const { t } = useTranslation()
  const upgradableNfts = useMemo(() => {
    return gmNfts.filter(nft => parseInt(nft.level, 10) >= Number(usersGM.gmLevel))
  }, [gmNfts, usersGM.gmLevel])

  const visibleCards = useBreakpointValue({ base: 3, md: 3, lg: 3 }) || 1
  const initialIndex = upgradableNfts.findIndex(nft => nft.level === usersGM.gmLevel)
  const [currentIndex, setCurrentIndex] = useState(initialIndex !== -1 ? initialIndex - 1 : 0)
  const [centeredNFT, setCenteredNFT] = useState<string | undefined>(usersGM.gmLevel)

  const getVisibleNFTs = () => {
    const visibleNFTs = []
    for (let i = 0; i < visibleCards; i++) {
      const index = (currentIndex + i) % upgradableNfts.length
      visibleNFTs.push(upgradableNfts[index])
    }
    return visibleNFTs
  }

  const handleSelect = (GMLevel: string | undefined) => {
    setSelectedGMLevel(GMLevel)
  }
  const nextCard = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1 >= upgradableNfts.length ? 0 : prevIndex + 1))
  }
  const prevCard = () => {
    setCurrentIndex(prevIndex => (prevIndex - 1 < 0 ? upgradableNfts.length - 1 : prevIndex - 1))
  }

  useEffect(() => {
    if (centeredNFT) {
      handleSelect(centeredNFT)
    }
  }, [centeredNFT])

  return (
    <Box position="relative">
      <Flex justify="center" align="center">
        {getVisibleNFTs().map((nft, index) => (
          <Box
            key={nft?.level}
            w={{ base: "30vw", md: "20vw", lg: "15vw" }}
            h={{ base: "30vw", md: "20vw", lg: "15vw" }}
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
            // onMouseEnter={() => setShowUpgradeButton(true)}
            // onMouseLeave={() => setShowUpgradeButton(false)}
            alignContent={"center"}
            cursor="pointer">
            {nft ? (
              <Flex direction="column" alignItems="center">
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {t("{{name}}", { name: nft?.name })}
                </Text>
                <Image
                  w={{ base: "20vw", md: "15vw", lg: "10vw" }}
                  h={{ base: "20vw", md: "15vw", lg: "10vw" }}
                  src={nft?.image}
                  alt={nft?.name}
                  objectFit="contain"
                  borderRadius="20px"
                />
                {/* TODO : check if ok to upgrade */}
                {/* {showUpgradeButton &&
                    nft?.level !== usersGM.gmLevel &&
                    Number(nft?.level) === Number(usersGM.gmLevel) + 1 && (
                      <GmActionButton
                        buttonProps={{
                          variant: "tertiaryAction",
                          w: "full",
                          boxShadow: "0px 0px 9.4px 0px #B1F16C",
                          color: "#080F1E",
                          fontSize: "sm",
                          h: "30px",
                          mt: 2,
                        }}>
                        {t("Upgrade now!")}
                      </GmActionButton>
                    )} */}
              </Flex>
            ) : (
              <Box
                w={{ base: "30vw", md: "15vw", lg: "10vw" }}
                h={{ base: "30vw", md: "15vw", lg: "10vw" }}
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
        top="55%"
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
        top="55%"
        transform="translateY(-50%)"
        onClick={nextCard}
        colorScheme="whiteAlpha"
        rounded="full"
      />
    </Box>
  )
}

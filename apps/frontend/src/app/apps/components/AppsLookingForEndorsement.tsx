import React, { useState, useCallback } from "react"
import { VStack, HStack, Heading, Text, IconButton, useBreakpointValue, Box } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { UilArrowRight, UilInfoCircle } from "@iconscout/react-unicons"
import { AppCards } from "./AppCards"
import { UnendorsedApp } from "@/api"

type Props = {
  xApps: UnendorsedApp[] | undefined
}

export const AppsLookingForEndorsement = ({ xApps }: Props) => {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const isMobile = useBreakpointValue({ base: true, md: false })

  const handleNextCard = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % (xApps?.length || 1))
  }, [xApps?.length])

  // Handle previous card  ( optionnal )
  // const handlePrevCard = useCallback(() => {
  //   setCurrentIndex(prevIndex => (prevIndex - 1 + (xApps?.length || 1)) % (xApps?.length || 1))
  // }, [xApps?.length])

  const visibleApps = xApps?.slice(currentIndex, currentIndex + 3)

  return (
    <VStack
      alignItems="flex-start"
      spacing={4}
      p={"20px"}
      width={"full"}
      border={"1px solid #EFEFEF"}
      borderRadius={"20px"}
      bgColor={"#FFFFFF"}>
      <HStack justifyContent={"space-between"} alignItems={"center"} w={"full"}>
        <VStack alignItems={"flex-start"}>
          <Heading>{t("New apps looking for endorsement")}</Heading>
          <Text>{t("These apps need to get enough endorsement score to become active")}</Text>
        </VStack>
        <UilInfoCircle color={"#004CFC"} />
      </HStack>
      <HStack
        spacing={4}
        width="full"
        position="relative"
        overflow="hidden"
        h={"full"}
        _after={{
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "20%",
          background: "linear-gradient(to left, #FFFFFF, rgba(239, 239, 239, 0))",
          display: xApps && xApps?.length > 2 ? "block" : "none",
          zIndex: 1,
        }}>
        <AnimatePresence initial={false}>
          {visibleApps?.map(xApp => (
            <motion.div
              key={xApp?.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{ width: isMobile ? "100%" : "calc(33.33% - 10px)", flexShrink: 0 }}>
              {/* /TODO: align the AppsCards for the carousel */}
              <Box width="full" height="full">
                <AppCards xAppId={xApp.id} variant="lookingForEndorsementApps" status={undefined} />
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
        {xApps?.length && xApps.length > 2 && (
          <IconButton
            icon={<UilArrowRight color={"#004CFC"} />}
            aria-label="Next card"
            onClick={handleNextCard}
            position="absolute"
            right="0"
            bgColor={"#E0E9FE"}
            top="50%"
            borderRadius="full"
            size="lg"
            zIndex={2}
          />
        )}
        {/* {xApps.length > 2 && (
          <IconButton
            icon={<UilArrowLeft color={"#004CFC"} />}
            aria-label="Previous card"
            onClick={handlePrevCard}
            position="absolute"
            left="0"
            bgColor={"#E0E9FE"}
            top="50%"
            borderRadius="full"
            size="lg"
            zIndex={2}
          />
        )} */}
      </HStack>
    </VStack>
  )
}

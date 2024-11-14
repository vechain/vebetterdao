import React, { useState, useCallback } from "react"
import { VStack, HStack, Heading, Text, IconButton, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { UilArrowRight, UilInfoCircle } from "@iconscout/react-unicons"
import { UnendorsedApp } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"

type Props = {
  filteredApps: UnendorsedApp[]
}

export const AppsLookingForEndorsement = ({ filteredApps }: Props) => {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const isMobile = useBreakpointValue({ base: true, md: false })

  const handleNextCard = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % (filteredApps.length || 1))
  }, [filteredApps.length])

  const visibleApps = filteredApps.slice(currentIndex, currentIndex + 3)

  return (
    <VStack
      alignItems="flex-start"
      spacing={4}
      p={"20px"}
      width={"full"}
      border={"1px solid #EFEFEF"}
      borderRadius={"20px"}
      bgColor={"#FFFFFF"}
      boxShadow="0px 8px 16px 0px #00000014">
      <HStack justifyContent={"space-between"} alignItems={"center"} w={"full"}>
        <VStack>
          <Heading size="2xl">{t("New apps looking for endorsement")}</Heading>
          <Text color="#6a6a6a">{t("These apps need to get enough endorsement score to become active")}</Text>
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
          display: filteredApps.length > 2 ? "block" : "none",
          zIndex: 1,
        }}>
        <AnimatePresence initial={false}>
          {visibleApps.map(xApp => (
            <motion.div
              key={xApp?.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{ width: isMobile ? "100%" : "calc(33.33% - 10px)", flexShrink: 0 }}>
              <UnendorsedAppCard key={xApp.id} xApp={xApp} />
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredApps.length > 2 && (
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
      </HStack>
    </VStack>
  )
}

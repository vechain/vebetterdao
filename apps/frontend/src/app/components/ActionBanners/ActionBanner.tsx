import { useState } from "react"
import { DoActionBanner } from "./components/DoActionBanner"
import { motion, AnimatePresence } from "framer-motion"
import { Text, HStack, Flex, Icon } from "@chakra-ui/react"
import { FaChevronDown, FaChevronUp } from "react-icons/fa6"
import { ClaimB3trBanner } from "./components/ClaimB3trBanner"
import { useCurrentRoundReward } from "@/api"
import { CastVoteBanner } from "./components/CastVoteBanner"

export const ActionBanner = () => {
  const [isVisible, setIsVisible] = useState(true)

  const { rewards, isLoading: isRoundRewardLoading } = useCurrentRoundReward()
  const showClaimB3trBanner = (!isRoundRewardLoading && rewards > 0) || true
  const showDoActionBanner = true
  const showCastVoteBanner = true

  if (!showClaimB3trBanner && !showDoActionBanner && !showCastVoteBanner) return null

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            style={{
              overflow: "hidden",
              maxWidth: "100%",
              width: "100%",
              minWidth: "100%",
            }}
            initial={{ height: 0, opacity: 0 }}
            exit={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }}>
            <Flex gap={4} pb={2} overflowX="auto" maxW="full" w="full" minW="full">
              {showDoActionBanner && (
                <Flex minW="full" w="full" maxW="full">
                  <DoActionBanner />
                </Flex>
              )}
              {showClaimB3trBanner && (
                <Flex minW="full" w="full" maxW="full">
                  <ClaimB3trBanner />
                </Flex>
              )}
              {showCastVoteBanner && (
                <Flex minW="full" w="full" maxW="full">
                  <CastVoteBanner />
                </Flex>
              )}
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
      <HStack
        justifyContent="center"
        gap={2}
        mt={2}
        onClick={() => setIsVisible(!isVisible)}
        cursor="pointer"
        _hover={{ textDecoration: "underline" }}>
        <Flex flex={1} border="1px solid" borderColor="#D6D6D6" />
        <Flex as="button">
          <HStack>
            <Icon as={isVisible ? FaChevronUp : FaChevronDown} color={"#D6D6D6"} />
            <Text color="#6A6A6A" fontSize={"sm"}>
              {isVisible ? "HIDE ALERT" : "SHOW ALERT"}
            </Text>
            <Icon as={isVisible ? FaChevronUp : FaChevronDown} color={"#D6D6D6"} />
          </HStack>
        </Flex>
        <Flex flex={1} border="1px solid" borderColor="#D6D6D6" />
      </HStack>
    </>
  )
}

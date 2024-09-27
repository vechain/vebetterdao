import { useState } from "react"
import { DoActionBanner } from "./components/DoActionBanner"
import { motion, AnimatePresence } from "framer-motion"
import { Text, HStack, Flex, Icon, Box } from "@chakra-ui/react"
import { FaChevronDown, FaChevronUp } from "react-icons/fa6"
import { ClaimB3trBanner } from "./components/ClaimB3trBanner"
import { useCurrentRoundReward } from "@/api"

export const ActionBanner = () => {
  const [isVisible, setIsVisible] = useState(true)

  const { rewards, isLoading: isRoundRewardLoading } = useCurrentRoundReward()
  const showClaimB3trBanner = !isRoundRewardLoading && rewards > 0
  const showDoActionBanner = true

  if (!showClaimB3trBanner && !showDoActionBanner) return null

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            style={{
              overflow: "hidden",
            }}
            initial={{ height: 0, opacity: 0 }}
            exit={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }}>
            <Box overflowX={"auto"}>
              {showClaimB3trBanner && <ClaimB3trBanner />}
              {showDoActionBanner && <DoActionBanner />}
            </Box>
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

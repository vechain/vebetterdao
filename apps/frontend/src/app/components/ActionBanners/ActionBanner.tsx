import { useState } from "react"
import { DoActionBanner } from "../DoActionBanner"
import { motion, AnimatePresence } from "framer-motion"
import { Text, HStack, Flex, Icon } from "@chakra-ui/react"
import { FaChevronDown, FaChevronUp } from "react-icons/fa6"

export const ActionBanner = () => {
  const [isVisible, setIsVisible] = useState(true)

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
            <DoActionBanner />
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

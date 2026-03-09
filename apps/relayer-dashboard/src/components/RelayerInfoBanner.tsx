"use client"

import { Box, Heading, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { LuChevronRight } from "react-icons/lu"

import { RelayerInfoModal } from "./RelayerInfoModal"

export function RelayerInfoBanner() {
  const { open, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Box
        bg="banner.green"
        borderRadius="2xl"
        p={{ base: 4, md: 6 }}
        cursor="pointer"
        onClick={onOpen}
        transition="opacity 0.2s"
        _hover={{ opacity: 0.9 }}>
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={1}>
            <Heading size="md" fontWeight="bold">
              {"Learn about relayers"}
            </Heading>
            <Text textStyle="sm" color="text.subtle">
              {
                "To automate VeBetterDAO user's participation, relayers decentralize and increase the security of the DAO."
              }
            </Text>
          </VStack>
          <Box as="span" color="text.subtle" flexShrink={0}>
            <LuChevronRight />
          </Box>
        </HStack>
      </Box>

      <RelayerInfoModal isOpen={open} onClose={onClose} />
    </>
  )
}

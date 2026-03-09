"use client"

import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { LuChevronRight, LuCircleHelp } from "react-icons/lu"

export function FeelLostBanner() {
  return (
    <NextLink href="/learn">
      <Box
        bg="banner.blue"
        borderRadius="2xl"
        p={{ base: 4, md: 6 }}
        cursor="pointer"
        transition="opacity 0.2s"
        _hover={{ opacity: 0.9 }}>
        <HStack justify="space-between" align="center">
          <HStack gap={4} align="center">
            <Box as="span" color="text.default" fontSize="24px" lineHeight="1" flexShrink={0}>
              <LuCircleHelp />
            </Box>
            <VStack align="start" gap={1}>
              <Heading size="md" fontWeight="bold">
                {"Feel lost?"}
              </Heading>
              <Text textStyle="sm" color="text.subtle">
                {"Learn how auto-voting, relayers, and rewards work on VeBetterDAO."}
              </Text>
            </VStack>
          </HStack>
          <Box as="span" color="text.subtle" flexShrink={0}>
            <LuChevronRight />
          </Box>
        </HStack>
      </Box>
    </NextLink>
  )
}

"use client"

import { Box, Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { LuChevronRight, LuCircleHelp } from "react-icons/lu"

import { useNavigation } from "@/hooks/useNavigation"

export function FeelLostBanner() {
  const { setActivePage } = useNavigation()

  return (
    <Box
      bg="banner.blue"
      borderRadius="2xl"
      p={{ base: 4, md: 6 }}
      cursor="pointer"
      transition="opacity 0.2s"
      _hover={{ opacity: 0.9 }}
      onClick={() => setActivePage("learn")}>
      <HStack justify="space-between" align="center">
        <HStack gap={4} align="center">
          <Icon color="text.default" boxSize={6} flexShrink={0}>
            <LuCircleHelp />
          </Icon>
          <VStack align="start" gap={1}>
            <Heading size="md" fontWeight="bold">
              {"Feel lost?"}
            </Heading>
            <Text textStyle="sm" color="text.subtle">
              {"Learn how auto-voting, relayers, and rewards work on VeBetterDAO."}
            </Text>
          </VStack>
        </HStack>
        <Icon color="text.subtle" flexShrink={0}>
          <LuChevronRight />
        </Icon>
      </HStack>
    </Box>
  )
}

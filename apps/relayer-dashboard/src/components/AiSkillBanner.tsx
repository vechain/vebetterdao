"use client"

import { Box, Button, Heading, HStack, Icon, Link, Text, VStack } from "@chakra-ui/react"
import { LuBrain, LuChevronRight } from "react-icons/lu"

const SKILL_URL = "https://github.com/vechain/vechain-ai-skills"

export function AiSkillBanner() {
  return (
    <Link href={SKILL_URL} target="_blank" rel="noopener noreferrer" _hover={{ textDecoration: "none" }}>
      <Box
        bg="banner.green"
        borderRadius="2xl"
        p={{ base: 4, md: 6 }}
        cursor="pointer"
        transition="opacity 0.2s"
        _hover={{ opacity: 0.9 }}>
        <HStack justify="space-between" align="center">
          <HStack gap={4} align="center">
            <Icon color="text.default" boxSize={6} flexShrink={0}>
              <LuBrain />
            </Icon>
            <VStack align="start" gap={1}>
              <Heading size="md" fontWeight="bold">
                {"Build with the AI Skill"}
              </Heading>
              <Text textStyle="sm" color="text.subtle">
                {
                  "Install our AI skill to give your coding assistant full context on the relayer system — contracts, APIs, architecture, and best practices."
                }
              </Text>
            </VStack>
          </HStack>
          <Icon color="text.subtle" flexShrink={0}>
            <LuChevronRight />
          </Icon>
        </HStack>
      </Box>
    </Link>
  )
}

"use client"

import { Box, Heading, HStack, Icon, Link, Text, VStack } from "@chakra-ui/react"
import { LuExternalLink } from "react-icons/lu"
import { RiRobot3Line } from "react-icons/ri"

const SKILL_URL = "https://github.com/vechain/vechain-ai-skills"

export function AiSkillBanner() {
  return (
    <Link href={SKILL_URL} target="_blank" rel="noopener noreferrer" _hover={{ textDecoration: "none" }}>
      <Box
        bgGradient="to-r"
        gradientFrom={{ base: "cyan.50", _dark: "cyan.950" }}
        gradientTo={{ base: "purple.50", _dark: "purple.950" }}
        borderWidth="1px"
        borderColor={{ base: "purple.100", _dark: "purple.800" }}
        borderRadius="2xl"
        p={{ base: 4, md: 6 }}
        cursor="pointer"
        boxShadow="sm"
        transition="transform 0.2s, box-shadow 0.2s, opacity 0.2s"
        _hover={{ opacity: 0.96, transform: "translateY(-1px)", boxShadow: "md" }}>
        <HStack justify="space-between" align="center">
          <HStack gap={4} align="center">
            <Icon color="purple.fg" boxSize={6} flexShrink={0}>
              <RiRobot3Line />
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
            <LuExternalLink />
          </Icon>
        </HStack>
      </Box>
    </Link>
  )
}

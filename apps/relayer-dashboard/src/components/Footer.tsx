"use client"

import { Box, Container, Flex, HStack, Icon, Link, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { LuRadar } from "react-icons/lu"

import { useNavigation } from "@/hooks/useNavigation"

const RESOURCES = [
  { label: "Network Status", href: "https://vechainstats.com" },
  { label: "API Documentation", href: "https://docs.vechain.org" },
  { label: "Governance App", href: "https://governance.vebetterdao.org" },
]

const NAVIGATION = [
  { label: "Home", page: "home" as const },
  { label: "My Relayer", page: "relayer" as const },
  { label: "Become a Relayer", href: "/new-relayer" },
  { label: "Info", page: "info" as const },
]

function SyncingBlock() {
  const thor = useThor()

  const { data: blockNumber } = useQuery({
    queryKey: ["footerBestBlock"],
    queryFn: () => thor.blocks.getBestBlockCompressed(),
    enabled: !!thor,
    refetchInterval: 10_000,
    select: b => b?.number,
  })

  return (
    <HStack border="sm" borderColor="border.primary" borderRadius="md" px={3} py={2} justify="space-between" gap={4}>
      <VStack gap={0} align="start">
        <Text textStyle="xs" color="text.subtle" fontWeight="semibold" textTransform="uppercase">
          {"Syncing Block"}
        </Text>
        <Text textStyle="sm" fontWeight="semibold">
          {blockNumber != null ? `#${blockNumber.toLocaleString()}` : "–"}
        </Text>
      </VStack>
      <Box w={2} h={2} borderRadius="full" bg="status.positive.primary" />
    </HStack>
  )
}

function NavigationLinks() {
  const { setActivePage } = useNavigation()

  return (
    <VStack align="start" gap={2}>
      <Text fontWeight="bold" textStyle="sm">
        {"NAVIGATION"}
      </Text>
      {NAVIGATION.map(item =>
        "href" in item ? (
          <Link key={item.label} asChild textStyle="xs" color="text.subtle" _hover={{ color: "text.default" }}>
            <NextLink href={item.href!}>{item.label}</NextLink>
          </Link>
        ) : (
          <Link
            key={item.label}
            as="button"
            onClick={() => setActivePage(item.page)}
            textStyle="xs"
            color="text.subtle"
            _hover={{ color: "text.default" }}>
            {item.label}
          </Link>
        ),
      )}
    </VStack>
  )
}

export function Footer() {
  return (
    <Box as="footer" borderTop="sm" borderColor="border.secondary" bg="bg.primary" mt={8}>
      <Container maxW="breakpoint-xl" px={4} py={{ base: 8, md: 10 }}>
        <Flex w="full" direction={{ base: "column", md: "row" }} justify="space-between" gap={{ base: 8, md: 6 }}>
          <VStack align="start" gap={2} flexShrink={0}>
            <HStack gap={2}>
              <Icon color="blue.solid" boxSize={5}>
                <LuRadar />
              </Icon>
              <Text fontWeight="bold" textStyle="sm">
                {"Relayer Dashboard"}
              </Text>
            </HStack>
            <Text textStyle="xs" color="text.subtle">
              {"The central hub for managing and monitoring relayers."}
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 2, md: 3 }} gap={{ base: 8, md: 6 }}>
            <VStack align="start" gap={2}>
              <Text fontWeight="bold" textStyle="sm">
                {"RESOURCES"}
              </Text>
              {RESOURCES.map(link => (
                <Link
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  textStyle="xs"
                  color="text.subtle"
                  _hover={{ color: "text.default" }}>
                  {link.label}
                </Link>
              ))}
            </VStack>

            <NavigationLinks />

            <VStack align="start" gap={2}>
              <Text fontWeight="bold" textStyle="sm">
                {"Network"}
              </Text>
              <SyncingBlock />
            </VStack>
          </SimpleGrid>
        </Flex>

        <Text w="full" textStyle="xs" color="text.subtle" textAlign="center" pt={8}>
          {`© ${new Date().getFullYear()} VeBetterDAO Relayer Ecosystem. All rights reserved.`}
        </Text>
      </Container>
    </Box>
  )
}

"use client"

import { Box, Button, Heading, HStack, Icon, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { LuChevronRight, LuCoins, LuScale, LuServer, LuZap } from "react-icons/lu"

import { BaseModal } from "./BaseModal"

export function RelayerInfoBanner() {
  const { open, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Box
        bg="banner.blue"
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
          <Icon color="text.subtle" flexShrink={0}>
            <LuChevronRight />
          </Icon>
        </HStack>
      </Box>

      <BaseModal isOpen={open} onClose={onClose} showCloseButton isCloseable>
        <VStack gap={6} align="stretch">
          <VStack gap={2} align="start">
            <Heading size="lg" fontWeight="bold">
              {"What Are Relayers?"}
            </Heading>
            <Text color="text.subtle">
              {
                "Relayers are services that cast votes and claim rewards for users who enabled auto-voting. Anyone can run one — apps, community members, developers. You earn a share of rewards for the work you do."
              }
            </Text>
          </VStack>

          <HStack gap={4} align="start">
            <Icon color="text.subtle" mt={1} flexShrink={0}>
              <LuZap />
            </Icon>
            <VStack gap={1} align="start">
              <Text fontWeight="semibold">{"What You Do"}</Text>
              <Text textStyle="sm" color="text.subtle">
                {
                  "You run a relayer node that watches the blockchain. When a new round starts, it sees who has auto-voting enabled, submits their votes, and claims their rewards in batches. It loops every few minutes until everyone is served."
                }
              </Text>
            </VStack>
          </HStack>

          <HStack gap={4} align="start">
            <Icon color="text.subtle" mt={1} flexShrink={0}>
              <LuCoins />
            </Icon>
            <VStack gap={1} align="start">
              <Text fontWeight="semibold">{"How You Earn"}</Text>
              <Text textStyle="sm" color="text.subtle">
                {
                  "Each user you serve pays 10% of their weekly rewards (max 100 B3TR) into a shared pool. At the end of the week, the pool is split among relayers based on work done. Voting earns 3 points, claiming earns 1 point — more points, bigger share."
                }
              </Text>
            </VStack>
          </HStack>

          <HStack gap={4} align="start">
            <Icon color="text.subtle" mt={1} flexShrink={0}>
              <LuServer />
            </Icon>
            <VStack gap={1} align="start">
              <Text fontWeight="semibold">{"What You Need"}</Text>
              <Text textStyle="sm" color="text.subtle">
                {
                  "A wallet with some VTHO for gas, the relayer node software, and a connection to a VeChain Thor node. You can run it locally, on a server, or in Docker."
                }
              </Text>
            </VStack>
          </HStack>

          <HStack gap={4} align="start">
            <Icon color="text.subtle" mt={1} flexShrink={0}>
              <LuScale />
            </Icon>
            <VStack gap={1} align="start">
              <Text fontWeight="semibold">{"The Rules"}</Text>
              <Text textStyle="sm" color="text.subtle">
                {
                  "Every user must be served. If even one gets missed, nobody gets paid — the whole pool stays locked. It's first-come-first-served: if another relayer handles a user before you, you get nothing for that user. After the round is fully complete, you claim your share."
                }
              </Text>
            </VStack>
          </HStack>

          <Button variant="solid" size="md" rounded="full" onClick={onClose}>
            {"Got It"}
          </Button>
        </VStack>
      </BaseModal>
    </>
  )
}

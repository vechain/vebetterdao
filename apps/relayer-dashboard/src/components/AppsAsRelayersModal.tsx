"use client"

import { Button, Card, Heading, HStack, Icon, Separator, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { LuExternalLink, LuLayoutGrid, LuShieldCheck, LuUsers } from "react-icons/lu"

import { BaseModal } from "./BaseModal"

interface AppsAsRelayersModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AppsAsRelayersModal({ isOpen, onClose }: AppsAsRelayersModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton isCloseable>
      <VStack gap={5} align="stretch">
        <Heading size="lg" fontWeight="bold">
          {"Autovoting as a Service"}
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Card.Root variant="subtle" p={5}>
            <VStack align="start" gap={3}>
              <Icon color="blue.solid" boxSize={6}>
                <LuLayoutGrid />
              </Icon>
              <Text fontWeight="semibold">{"For X2Earn Apps"}</Text>
              <Text textStyle="sm" color="text.subtle">
                {
                  "If you're an app on VeBetterDAO, instead of paying veDelegate to get votes directed your way, become a relayer yourself. Your users set you as a preference, you execute their votes (which go to your app), and you earn relayer fees on top."
                }
              </Text>

              <Button variant="solid" size="sm" rounded="full">
                {"Documentation"}
                <Icon ml="1">
                  <LuExternalLink />
                </Icon>
              </Button>
            </VStack>
          </Card.Root>

          <Card.Root variant="subtle" p={5}>
            <VStack align="stretch" gap={3} justify="space-between" h="full">
              <Icon color="blue.solid" boxSize={6}>
                <LuUsers />
              </Icon>
              <Text fontWeight="semibold">{"For Community Navigators"}</Text>
              <Text textStyle="sm" color="text.subtle">
                {
                  "Respected community members who want to contribute to the DAO and be rewarded for it. Run a relayer node, help decentralize the voting process, and earn B3TR for the work you do."
                }
              </Text>

              <NextLink href="/new-relayer" onClick={onClose}>
                <Button variant="primary" size="sm" rounded="full">
                  {"Register as a Relayer"}
                </Button>
              </NextLink>
            </VStack>
          </Card.Root>
        </SimpleGrid>

        <Separator />

        <VStack align="start" gap={3}>
          <HStack gap={2}>
            <Icon color="blue.solid" boxSize={5}>
              <LuShieldCheck />
            </Icon>
            <Text fontWeight="semibold">{"Why Would an App Want to Do This?"}</Text>
          </HStack>
          <Text textStyle="sm" color="text.subtle">
            {
              "This is a no-brainer for apps on VeBetterDAO. You go from paying for votes to getting paid to handle them. Your users set you as a preference, you execute their votes (which go to your app), and you earn relayer fees on top."
            }
          </Text>
        </VStack>

        {/* <HStack gap={2} align="start" bg="banner.yellow" p={3} borderRadius="lg">
          <Icon color="text.default" mt={0.5} flexShrink={0}>
            <LuTriangleAlert />
          </Icon>
          <Text textStyle="sm">
            {
              "Important: don't be shady about it. Add your app to the user's preference list — don't replace their other choices."
            }
          </Text>
        </HStack> */}
      </VStack>
    </BaseModal>
  )
}

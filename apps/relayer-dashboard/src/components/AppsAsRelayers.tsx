"use client"

import { Box, Button, Card, CloseButton, Icon, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { LuArrowUpRight, LuSmartphone } from "react-icons/lu"

import { useDismissedBanner } from "@/hooks/useDismissedBanners"

import { AppsAsRelayersModal } from "./AppsAsRelayersModal"

export function AppsAsRelayers() {
  const { isDismissed, dismiss } = useDismissedBanner("apps-as-relayers")
  const { open, onOpen, onClose } = useDisclosure()

  if (isDismissed) return null

  return (
    <>
      <Card.Root p={{ base: "5", md: "8" }} variant="primary" overflow="hidden" position="relative" w="full">
        <CloseButton position="absolute" top="3" right="3" size="sm" zIndex={2} onClick={dismiss} />
        <VStack align="start" gap="3" position="relative" zIndex={1}>
          <Text textStyle={{ base: "xl", md: "3xl" }} fontWeight="bold">
            {"Autovoting as a Service"}
          </Text>
          <Text textStyle="lg" color="text.subtle">
            {"Stop paying for votes. Start getting paid to handle them."}
          </Text>
          <VStack gap="2" mt="1" flexWrap="wrap">
            <Button variant="link" size="sm" rounded="full" onClick={onOpen}>
              {"How It Works"}
              <LuArrowUpRight />
            </Button>
          </VStack>
        </VStack>
        <Box position="absolute" right="-1" bottom="-1" opacity={0.08}>
          <Icon color="text.subtle" boxSize={{ base: "24", md: "32" }}>
            <LuSmartphone />
          </Icon>
        </Box>
      </Card.Root>

      <AppsAsRelayersModal isOpen={open} onClose={onClose} />
    </>
  )
}

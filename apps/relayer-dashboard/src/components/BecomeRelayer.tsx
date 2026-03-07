"use client"

import { Box, Button, Card, CloseButton, HStack, Icon, Text, useDisclosure, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { LuArrowUpRight, LuRadar, LuRocket } from "react-icons/lu"

import { useDismissedBanner } from "@/hooks/useDismissedBanners"

import { RelayerInfoModal } from "./RelayerInfoModal"

export function BecomeRelayer() {
  const { open, onOpen, onClose } = useDisclosure()
  const { isDismissed, dismiss } = useDismissedBanner("become-relayer")

  if (isDismissed) return null

  return (
    <>
      <Card.Root
        p={{ base: "5", md: "8" }}
        bg="actions.primary.default"
        border="none"
        overflow="hidden"
        position="relative"
        w="full">
        <CloseButton
          position="absolute"
          top="3"
          right="3"
          size="sm"
          color="whiteAlpha.700"
          _hover={{ color: "white", bg: "whiteAlpha.200" }}
          zIndex={2}
          onClick={dismiss}
        />
        <VStack align="start" gap="3" position="relative" zIndex={1}>
          <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold" color="white">
            {"Become a relayer"}
          </Text>
          <Text textStyle="md" color="whiteAlpha.800">
            {"Run a relayer node, serve voters, earn B3TR."}
          </Text>
          <HStack gap="2" mt="4" flexWrap="wrap">
            <NextLink href="/new-relayer">
              <Button
                variant="outline"
                size="sm"
                rounded="full"
                color="white"
                borderColor="whiteAlpha.500"
                _hover={{ bg: "whiteAlpha.200" }}>
                {"Become a Relayer"}
                <Icon ml="1">
                  <LuRocket />
                </Icon>
              </Button>
            </NextLink>
            <Button variant="link" size="sm" rounded="full" color="white" onClick={onOpen}>
              {"Learn"}
              <LuArrowUpRight />
            </Button>
          </HStack>
        </VStack>
        <Box position="absolute" right="-2" bottom="-2" opacity={0.15}>
          <Icon color="white" boxSize={{ base: "24", md: "32" }}>
            <LuRadar />
          </Icon>
        </Box>
      </Card.Root>

      <RelayerInfoModal isOpen={open} onClose={onClose} />
    </>
  )
}

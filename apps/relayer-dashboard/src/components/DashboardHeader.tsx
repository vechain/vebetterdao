"use client"

import { Box, Heading, HStack } from "@chakra-ui/react"
import { WalletButton } from "@vechain/vechain-kit"

export function DashboardHeader() {
  return (
    <Box bg="bg.secondary" px={0} position="sticky" top={0} zIndex={3} w="full">
      <HStack justify="space-between" p={{ base: "8px 20px", lg: "16px 48px" }}>
        <Heading size="lg" fontWeight="bold">
          {"Relayer Dashboard"}
        </Heading>
        <WalletButton
          buttonStyle={{
            variant: "primaryAction",
            size: "md",
            borderRadius: "full",
            bg: "#004CFC",
            textColor: "white",
          }}
          connectionVariant="popover"
        />
      </HStack>
    </Box>
  )
}

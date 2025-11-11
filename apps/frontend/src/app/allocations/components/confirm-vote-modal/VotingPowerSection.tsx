"use client"

import { Box, HStack, Icon, Skeleton, Text } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { Flash } from "iconoir-react"
import { formatEther } from "viem"

import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

export const VotingPowerSection = () => {
  const { account } = useWallet()
  const { data: vot3Balance, isLoading } = useGetVot3Balance(account?.address)

  const original = vot3Balance ? Number(vot3Balance.original) : 0
  const scaled = formatEther(BigInt(original))
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return (
    <Box bg="bg.subtle" borderRadius="xl" p={4} borderWidth="1px" borderColor="border.primary">
      <HStack justify="space-between" align="center">
        <HStack gap={2}>
          <Icon as={Flash} boxSize={4} color="text.subtle" />
          <Text textStyle="sm" color="text.subtle" fontWeight="medium">
            {"Voting Power"}
          </Text>
        </HStack>
        <Skeleton loading={isLoading}>
          <Text textStyle="lg" fontWeight="semibold">
            {formatted}
          </Text>
        </Skeleton>
      </HStack>
    </Box>
  )
}

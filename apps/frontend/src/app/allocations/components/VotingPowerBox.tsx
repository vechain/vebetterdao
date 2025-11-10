"use client"

import { Card, VStack, Icon, Text, Button, Dialog, Skeleton } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { Flash } from "iconoir-react"
import { formatEther } from "viem"

import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

export const VotingPowerBox = () => {
  const { account } = useWallet()
  const { data: vot3Balance, isLoading } = useGetVot3Balance(account?.address)

  const original = vot3Balance ? Number(vot3Balance.original) : 0
  const scaled = formatEther(BigInt(original))
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return (
    <Card.Root
      p="4"
      variant="subtle"
      bgColor="status.positive.subtle"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between">
      <VStack flex={1} lineClamp={2}>
        <Text textStyle="xs">{"Voting Power"}</Text>
        <Skeleton loading={isLoading}>
          <Text textStyle="lg" fontWeight="semibold">
            {formatted}
          </Text>
        </Skeleton>
      </VStack>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button variant="primary">
            <Icon as={Flash} boxSize="4" />
            {"Power up"}
          </Button>
        </Dialog.Trigger>
      </Dialog.Root>
    </Card.Root>
  )
}

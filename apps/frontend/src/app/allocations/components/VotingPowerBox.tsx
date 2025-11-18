"use client"

import { Icon, Text, Button, Skeleton } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { Flash } from "iconoir-react"
import { useState } from "react"
import { formatEther } from "viem"

import { ConvertModal } from "@/components/Convert/components/Modal/ConvertModal"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

import { StatCard } from "./StatCard"

export const VotingPowerBox = () => {
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  const { data: vot3Balance, isLoading } = useGetVot3Balance(account?.address)
  const [isOpen, setIsOpen] = useState(false)

  const original = vot3Balance ? Number(vot3Balance.original) : 0
  const scaled = formatEther(BigInt(original))
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return (
    <StatCard
      showIcon={!isMobile}
      variant="positive"
      title="Voting power"
      icon={<Flash />}
      subtitle={
        <Skeleton loading={isLoading}>
          <Text textStyle={{ base: "lg", md: "2xl" }} fontWeight="semibold">
            {formatted}
          </Text>
        </Skeleton>
      }
      cta={
        <>
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            <Icon as={Flash} boxSize="4" />
            {"Power up"}
          </Button>

          <ConvertModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
      }
    />
  )
}

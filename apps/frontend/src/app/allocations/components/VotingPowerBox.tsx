"use client"

import { Icon, Text, Button, Skeleton } from "@chakra-ui/react"
import { Flash } from "iconoir-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { ConvertModal } from "@/components/Convert/components/Modal/ConvertModal"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { StatCard } from "./StatCard"

export const VotingPowerBox = () => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const { vot3Balance, isLoading } = useVotingPowerAtSnapshot()

  const [isOpen, setIsOpen] = useState(false)

  const formatted = vot3Balance?.formatted ?? "0"

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
            {t("Power up")}
          </Button>

          <ConvertModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
      }
    />
  )
}

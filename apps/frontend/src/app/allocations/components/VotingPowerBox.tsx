"use client"

import { Icon, Text, Button, Skeleton, VStack, Badge } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { Flash } from "iconoir-react"
import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { ConvertModal } from "@/components/Convert/components/Modal/ConvertModal"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

import { StatCard } from "./StatCard"

export const VotingPowerBox = () => {
  const { isMobile } = useBreakpoints()
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()
  const { account } = useWallet()

  const { vot3Balance, isLoading } = useVotingPowerAtSnapshot()
  const { data: currentVot3Balance, isLoading: isCurrentVot3BalanceLoading } = useGetVot3Balance(account?.address)

  const formatted = vot3Balance?.formatted ?? "-"
  const votingPowerNextRound = BigInt(currentVot3Balance?.original || "0") - BigInt(vot3Balance?.original || "0")

  return (
    <StatCard
      showIcon={!isMobile}
      variant="positive"
      title={t("Voting power")}
      icon={<Flash />}
      subtitle={
        <Skeleton loading={isLoading || isCurrentVot3BalanceLoading}>
          <VStack align="flex-start" gap="1">
            <Text textStyle={{ base: "lg", md: "2xl" }} fontWeight="semibold">
              {formatted}
            </Text>

            {votingPowerNextRound !== 0n && (
              <Badge variant="neutral" bg="card.default" color="text.subtle" fontWeight="normal" size="sm" rounded="sm">
                <Trans
                  i18nKey="<bold>{{sign}}{{votingPowerNextRound}}</bold> votes in next round"
                  values={{
                    sign: votingPowerNextRound > 0n ? "+" : "",
                    votingPowerNextRound: getCompactFormatter(2).format(Number(formatEther(votingPowerNextRound))),
                  }}
                  components={{
                    bold: (
                      <Text
                        color={votingPowerNextRound > 0n ? "status.positive.strong" : "status.negative.strong"}
                        as="span"
                      />
                    ),
                  }}
                />
              </Badge>
            )}
          </VStack>
        </Skeleton>
      }
      cta={
        !!account?.address && (
          <>
            <Button variant="primary" onClick={() => setIsOpen(true)}>
              <Icon as={Flash} boxSize="4" />
              {t("Power up")}
            </Button>

            <ConvertModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
          </>
        )
      }
    />
  )
}

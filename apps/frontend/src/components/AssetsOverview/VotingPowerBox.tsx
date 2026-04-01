"use client"

import { Text, Skeleton, Mark, Badge } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { Flash } from "iconoir-react"
import { useCallback, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

import { StatCard } from "./StatCard"
import { VotingPowerBottomSheet } from "./VotingPowerBottomSheet"

export const VotingPowerBox = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const onClose = useCallback(() => setIsOpen(false), [])

  const { vot3Balance, isLoading, votesAtSnapshot } = useVotingPowerAtSnapshot()
  const { data: currentVot3Balance, isLoading: isCurrentVot3BalanceLoading } = useGetVot3Balance(account?.address)

  const formatted = vot3Balance?.formatted ?? "-"
  const votingPowerNextRound = BigInt(currentVot3Balance?.original || "0") - BigInt(vot3Balance?.original || "0")

  return (
    <>
      <StatCard
        variant="positive"
        title={t("Your voting power")}
        icon={<Flash />}
        isLoading={isLoading || isCurrentVot3BalanceLoading}
        onClick={() => setIsOpen(true)}
        subtitle={
          <Skeleton asChild loading={isLoading || isCurrentVot3BalanceLoading}>
            <Text textStyle={{ base: "sm", md: "2xl" }} lineClamp={1}>
              <Mark variant="text" fontWeight="semibold">
                {formatted}
              </Mark>
              {votingPowerNextRound !== 0n && (
                <>
                  {" "}
                  <Badge
                    variant="neutral"
                    bg="card.subtle"
                    color="text.subtle"
                    fontWeight="normal"
                    size="sm"
                    rounded="md">
                    <Trans
                      i18nKey="<bold>{{sign}}{{votingPowerNextRound}}</bold> in next round"
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
                </>
              )}
            </Text>
          </Skeleton>
        }
      />
      <VotingPowerBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        formatted={formatted}
        votingPowerNextRound={votingPowerNextRound}
        votesAtSnapshot={votesAtSnapshot}
        isLoading={isLoading || isCurrentVot3BalanceLoading}
      />
    </>
  )
}

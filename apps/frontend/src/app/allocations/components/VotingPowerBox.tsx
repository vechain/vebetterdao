"use client"

import { Card, Icon, Text, Button, Skeleton, VStack, Badge, HStack, Square } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { Flash } from "iconoir-react"
import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { PowerUpModal } from "@/components/PowerUpModal"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

export const VotingPowerBox = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()
  const { account } = useWallet()

  const { vot3Balance, isLoading } = useVotingPowerAtSnapshot()
  const { data: currentVot3Balance, isLoading: isCurrentVot3BalanceLoading } = useGetVot3Balance(account?.address)

  const formatted = vot3Balance?.formatted ?? "-"
  const votingPowerNextRound = BigInt(currentVot3Balance?.original || "0") - BigInt(vot3Balance?.original || "0")

  return (
    <Card.Root
      p={{ base: "4", md: "6" }}
      variant="subtle"
      border="sm"
      borderColor="border.secondary"
      bgColor="status.positive.subtle"
      flexDirection={{ base: "column", md: "row" }}
      alignItems={{ base: "stretch", md: "center" }}
      justifyContent="space-between"
      gap={{ base: "3", md: "4" }}>
      <HStack gap="3" alignItems="center" flex={1}>
        <Square rounded="12px" bg="status.positive.secondary" aspectRatio={1} height={{ base: "56px", md: "60px" }}>
          <Icon boxSize={{ base: "8", md: "9" }} color="status.positive.strong">
            <Flash />
          </Icon>
        </Square>

        <Skeleton loading={isLoading || isCurrentVot3BalanceLoading}>
          <VStack align="flex-start" gap="0.5">
            <Text textStyle={{ base: "sm", md: "md" }} color="text.subtle">
              {t("Your voting power")}
            </Text>
            <VStack gap="2" alignItems="baseline">
              <Text textStyle={{ base: "3xl", md: "2xl" }} fontWeight="semibold">
                {formatted}
              </Text>
              {votingPowerNextRound !== 0n && (
                <Badge
                  variant="neutral"
                  bg="card.subtle"
                  color="text.subtle"
                  fontWeight="normal"
                  size="sm"
                  rounded="md">
                  <Trans
                    i18nKey="<bold>{{sign}}{{votingPowerNextRound}}</bold> next round"
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
          </VStack>
        </Skeleton>
      </HStack>

      {!!account?.address && (
        <>
          <Button variant="primary" width={{ base: "full", md: "auto" }} onClick={() => setIsOpen(true)}>
            <Icon as={Flash} boxSize="4" />
            {t("Power up")}
          </Button>

          <PowerUpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
      )}
    </Card.Root>
  )
}

"use client"
import { Card, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { VETIcon } from "@/components/Icons/VETIcon"
import { VOT3Icon } from "@/components/Icons/VOT3Icon"
import { VTHOIcon } from "@/components/Icons/VTHOIcon"

import {
  useTreasuryB3trBalance,
  useTreasuryVetBalance,
  useTreasuryVot3Balance,
  useTreasuryVthoBalance,
} from "../../../api/contracts/treasury/useTreasuryBalances"

const TokenIcon = ({ symbol }: { symbol: string }) => {
  const size = { base: "28px", md: "32px" }
  switch (symbol) {
    case "B3TR":
      return <B3TRIcon boxSize={size} />
    case "VET":
      return <VETIcon boxSize={size} />
    case "VTHO":
      return <VTHOIcon boxSize={size} />
    case "VOT3":
      return <VOT3Icon boxSize={size} />
    default:
      return null
  }
}

export const TreasuryOverview = () => {
  const { t } = useTranslation()
  const { data: b3trBalance, isLoading: b3trLoading } = useTreasuryB3trBalance()
  const { data: vetBalance, isLoading: vetLoading } = useTreasuryVetBalance()
  const { data: vthoBalance, isLoading: vthoLoading } = useTreasuryVthoBalance()
  const { data: vot3Balance, isLoading: vot3Loading } = useTreasuryVot3Balance()

  const { data: b3trUsdPrice } = useGetTokenUsdPrice("B3TR")
  const { data: vetUsdPrice } = useGetTokenUsdPrice("VET")

  const isLoading = b3trLoading || vetLoading || vthoLoading || vot3Loading

  const formattedUsd = useMemo(() => {
    if (!b3trBalance?.scaled || !vetBalance?.scaled) return null
    const b3trValue = Number(b3trBalance.scaled) * (b3trUsdPrice ?? 0)
    const vetValue = Number(vetBalance.scaled) * (vetUsdPrice ?? 0)
    return getCompactFormatter().format(b3trValue + vetValue)
  }, [b3trBalance?.scaled, vetBalance?.scaled, b3trUsdPrice, vetUsdPrice])

  const assets = useMemo(() => {
    const raw = [
      { symbol: "B3TR", balance: b3trBalance?.formatted ?? "0", scaled: b3trBalance?.scaled ?? "0" },
      { symbol: "VET", balance: vetBalance?.formatted ?? "0", scaled: vetBalance?.scaled ?? "0" },
      { symbol: "VTHO", balance: vthoBalance?.formatted ?? "0", scaled: vthoBalance?.scaled ?? "0" },
      { symbol: "VOT3", balance: vot3Balance?.formatted ?? "0", scaled: vot3Balance?.scaled ?? "0" },
    ].filter(a => Number(a.scaled) > 0)

    return raw
  }, [b3trBalance, vetBalance, vthoBalance, vot3Balance])

  return (
    <Card.Root w="full">
      <Card.Body>
        <VStack align="stretch" gap={8}>
          <VStack align="start" gap={4}>
            <Text
              textStyle="xs"
              color="text.subtle"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider">
              {t("Asset Composition")}
            </Text>
            <Skeleton loading={isLoading} rounded="md">
              <Text textStyle={{ base: "3xl", md: "4xl" }} fontWeight="bold">
                {"~$"}
                {formattedUsd ?? "0"}
                <Text as="span" textStyle={{ base: "md", md: "lg" }} fontWeight="normal" color="text.subtle" ml={2}>
                  {"USD"}
                </Text>
              </Text>
            </Skeleton>
          </VStack>

          <Skeleton loading={isLoading} rounded="md">
            <VStack align="stretch" gap={0}>
              {assets.map(asset => (
                <HStack
                  key={asset.symbol}
                  justify="space-between"
                  py={3}
                  borderTop="1px solid"
                  borderColor="border.secondary">
                  <HStack gap={3}>
                    <TokenIcon symbol={asset.symbol} />
                    <Text textStyle="sm" fontWeight="semibold">
                      {asset.symbol}
                    </Text>
                  </HStack>
                  <Text textStyle="sm" fontWeight="semibold">
                    {asset.balance}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Skeleton>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

"use client"
import { Button, Card, Heading, HStack, Link, Separator, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FiExternalLink } from "react-icons/fi"

import { AddressButton } from "@/components/AddressButton"
import { getExplorerAddressLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import {
  useTreasuryB3trBalance,
  useTreasuryVetBalance,
  useTreasuryVot3Balance,
  useTreasuryVthoBalance,
} from "../hooks/useTreasuryBalances"

const treasuryAddress = getConfig().treasuryContractAddress

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
    return [
      { symbol: "B3TR", balance: b3trBalance?.formatted ?? "0", scaled: b3trBalance?.scaled ?? "0" },
      { symbol: "VET", balance: vetBalance?.formatted ?? "0", scaled: vetBalance?.scaled ?? "0" },
      { symbol: "VTHO", balance: vthoBalance?.formatted ?? "0", scaled: vthoBalance?.scaled ?? "0" },
      { symbol: "VOT3", balance: vot3Balance?.formatted ?? "0", scaled: vot3Balance?.scaled ?? "0" },
    ].filter(a => Number(a.scaled) > 0)
  }, [b3trBalance, vetBalance, vthoBalance, vot3Balance])

  return (
    <Card.Root w="full">
      <Card.Body>
        <VStack align="stretch" gap={6}>
          <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={1}>
              <Heading size={{ base: "xl", md: "2xl" }} fontWeight="bold">
                {t("Treasury")}
              </Heading>
              <Text textStyle="sm" color="text.muted">
                {t("VeBetterDAO community treasury")}
              </Text>
            </VStack>
            <HStack gap={2}>
              <AddressButton address={treasuryAddress} addressIconProps={{ boxSize: "8", rounded: "full" }} />
              <Button asChild variant="outline" size="sm">
                <Link href={getExplorerAddressLink(treasuryAddress)} target="_blank" rel="noopener noreferrer">
                  <FiExternalLink />
                </Link>
              </Button>
            </HStack>
          </HStack>

          <Skeleton loading={isLoading}>
            {formattedUsd && (
              <VStack align="start" gap={0}>
                <Text textStyle={{ base: "2xl", md: "3xl" }} fontWeight="bold">
                  {"~$"}
                  {formattedUsd}
                  {" USD"}
                </Text>
                <Text textStyle="xs" color="text.muted">
                  {t("Total estimated value")}
                </Text>
              </VStack>
            )}
          </Skeleton>

          <Separator />

          <Skeleton loading={isLoading} rounded="md">
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
              {assets.map(asset => (
                <VStack key={asset.symbol} gap={0} align="start" py={2}>
                  <Text textStyle="xs" color="text.muted" fontWeight="semibold">
                    {asset.symbol}
                  </Text>
                  <Text textStyle="lg" fontWeight="bold">
                    {asset.balance}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
          </Skeleton>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

"use client"
import {
  Stack,
  Card,
  Heading,
  HStack,
  Icon,
  IconButton,
  Link,
  SimpleGrid,
  Skeleton,
  Text,
  useClipboard,
  VStack,
} from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaCheck, FaCopy } from "react-icons/fa6"
import { FiExternalLink } from "react-icons/fi"

import { AddressButton } from "@/components/AddressButton"
import { getExplorerAddressLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import {
  useTreasuryB3trBalance,
  useTreasuryVetBalance,
  useTreasuryVot3Balance,
  useTreasuryVthoBalance,
} from "../../../api/contracts/treasury/useTreasuryBalances"

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
        <VStack align="stretch" gap={8}>
          <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={1}>
              <Heading size={{ base: "lg", md: "xl" }} fontWeight="bold">
                {t("Asset composition")}
              </Heading>
            </VStack>
            <HStack gap={2}>
              <AddressButton
                address={treasuryAddress}
                size={"sm"}
                showAddressIcon={false}
                display={{ base: "none", md: "inline-flex" }}
              />
              <CopyAddressIconButton address={treasuryAddress} />
              <IconButton asChild aria-label="View on explorer" variant="outline" size="sm">
                <Link href={getExplorerAddressLink(treasuryAddress)} target="_blank" rel="noopener noreferrer">
                  <FiExternalLink />
                </Link>
              </IconButton>
            </HStack>
          </HStack>

          <Stack w="full" direction={{ base: "column", md: "row" }} justify="space-between" gap={4}>
            <Skeleton loading={isLoading} rounded="md">
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                {assets.map(asset => (
                  <VStack key={asset.symbol} gap={0} align="start" justify="space-between">
                    <Text textStyle={{ base: "2xl", md: "3xl" }} fontWeight="bold">
                      {asset.balance}
                    </Text>
                    <Text textStyle="xs" color="text.muted">
                      {asset.symbol}
                    </Text>
                  </VStack>
                ))}
              </SimpleGrid>
            </Skeleton>
            <Skeleton loading={isLoading}>
              {formattedUsd && (
                <VStack
                  pt={{ base: 4, md: 0 }}
                  borderTop={{ base: "1px solid", md: "none" }}
                  borderColor="border.secondary"
                  align={{ base: "start", md: "end" }}
                  gap={0}>
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
          </Stack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

const CopyAddressIconButton = ({ address }: { address: string }) => {
  const { copy, copied } = useClipboard({ value: address })

  return (
    <IconButton
      aria-label="Copy address"
      variant="outline"
      size="sm"
      onClick={copy}
      display={{ base: "inline-flex", md: "none" }}>
      <Icon as={copied ? FaCheck : FaCopy} boxSize={3} />
    </IconButton>
  )
}

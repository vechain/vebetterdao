"use client"
import { Button, Card, Heading, HStack, Link, Skeleton, Text, VStack, Wrap } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import { formatEther } from "ethers"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiAlertCircle, FiArrowDownLeft, FiArrowUpRight, FiExternalLink } from "react-icons/fi"

import { EmptyState } from "@/components/ui/empty-state"
import { useGetVetDomains } from "@/hooks/useGetVetDomains"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import { GMUpgradeMap, useGMUpgradeInfo } from "../hooks/useGMUpgradeInfo"
import { TreasuryTransfer, useTreasuryTransfers } from "../hooks/useTreasuryTransfers"

const config = getConfig()
const treasuryAddress = config.treasuryContractAddress.toLowerCase()
const emissionsAddress = config.emissionsContractAddress.toLowerCase()
const grantsManagerAddress = config.grantsManagerContractAddress.toLowerCase()
const timelockAddress = config.timelockContractAddress.toLowerCase()
const voterRewardsAddress = config.voterRewardsContractAddress.toLowerCase()
const xAllocationPoolAddress = config.xAllocationPoolContractAddress.toLowerCase()

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const KNOWN_ADDRESSES: Record<string, string> = {
  [emissionsAddress]: "Emissions",
  [grantsManagerAddress]: "Grants",
  [timelockAddress]: "Governance Timelock",
  [voterRewardsAddress]: "Voter Rewards",
  [xAllocationPoolAddress]: "X-Allocation Pool",
}

type FilterCategory = "all" | "in" | "out" | "emission" | "surplus" | "gm" | "other"

const FILTER_OPTIONS: { value: FilterCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in", label: "In" },
  { value: "out", label: "Out" },
  { value: "emission", label: "Emissions" },
  { value: "surplus", label: "App voting surplus" },
  { value: "gm", label: "GM Upgrades" },
  { value: "other", label: "Other" },
]

const resolveKnownName = (address?: string): string | null => {
  if (!address) return null
  return KNOWN_ADDRESSES[address.toLowerCase()] ?? null
}

const isFromMint = (tx: TreasuryTransfer): boolean => tx.from.toLowerCase() === ZERO_ADDRESS

const resolveDirection = (tx: TreasuryTransfer): "in" | "out" => {
  if (tx.from.toLowerCase() === treasuryAddress) return "out"
  return "in"
}

const resolveCategory = (tx: TreasuryTransfer, gmUpgrades: GMUpgradeMap): FilterCategory => {
  if (gmUpgrades[tx.txId]) return "gm"

  const fromName = resolveKnownName(tx.from)
  if (isFromMint(tx) || fromName === "Emissions") return "emission"
  if (fromName === "X-Allocation Pool") return "surplus"

  const direction = resolveDirection(tx)
  const toName = resolveKnownName(tx.to)

  if (direction === "out" && toName) return "out"
  if (direction === "out") return "other"
  if (direction === "in" && !fromName) return "other"

  return direction
}

const resolveLabel = (tx: TreasuryTransfer, direction: "in" | "out", gmUpgrades: GMUpgradeMap): string => {
  const gmLevel = gmUpgrades[tx.txId]
  if (gmLevel) return `GM upgrade to ${gmLevel}`

  const fromName = resolveKnownName(tx.from)
  const toName = resolveKnownName(tx.to)

  if (isFromMint(tx) || fromName === "Emissions") return "Weekly emission"
  if (fromName === "X-Allocation Pool") return "App voting surplus"
  if (toName === "Grants") return "Grant funding"

  return direction === "out" ? "B3TR Sent" : "B3TR Received"
}

const getCounterpartyAddress = (tx: TreasuryTransfer, direction: "in" | "out"): string | undefined => {
  if (isFromMint(tx)) return undefined
  return direction === "out" ? tx.to : tx.from
}

const formatCounterparty = (
  tx: TreasuryTransfer,
  direction: "in" | "out",
  domainMap: Record<string, string>,
): string => {
  if (isFromMint(tx)) return "Emissions"
  const rawAddress = getCounterpartyAddress(tx, direction)
  if (!rawAddress) return ""
  return resolveKnownName(rawAddress) ?? domainMap[rawAddress.toLowerCase()] ?? humanAddress(rawAddress, 6, 4)
}

const matchesFilter = (tx: TreasuryTransfer, filter: FilterCategory, gmUpgrades: GMUpgradeMap): boolean => {
  if (filter === "all") return true
  const category = resolveCategory(tx, gmUpgrades)
  if (filter === "in")
    return category === "in" || category === "emission" || category === "surplus" || category === "gm"
  if (filter === "out") return category === "out"
  return category === filter
}

export const TreasuryTransfersList = () => {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<FilterCategory>("all")
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useTreasuryTransfers()

  const transactions = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? []
  }, [data])

  const candidateTxIds = useMemo(() => {
    return transactions
      .filter(tx => {
        const direction = resolveDirection(tx)
        return direction === "in" && !isFromMint(tx) && !resolveKnownName(tx.from)
      })
      .map(tx => tx.txId)
  }, [transactions])

  const { data: gmUpgrades = {} } = useGMUpgradeInfo(candidateTxIds)

  const filtered = useMemo(() => {
    return transactions.filter(tx => matchesFilter(tx, filter, gmUpgrades))
  }, [transactions, filter, gmUpgrades])

  const unknownAddresses = useMemo(() => {
    const set = new Set<string>()
    for (const tx of transactions) {
      const addr = getCounterpartyAddress(tx, resolveDirection(tx))
      if (addr && !resolveKnownName(addr)) set.add(addr)
    }
    return Array.from(set)
  }, [transactions])

  const { data: vetDomains } = useGetVetDomains(unknownAddresses.length > 0 ? unknownAddresses : undefined)

  const domainMap = useMemo((): Record<string, string> => {
    if (!vetDomains || !unknownAddresses.length) return {}
    const map: Record<string, string> = {}
    for (let i = 0; i < unknownAddresses.length; i++) {
      const domain = vetDomains[i]
      const addr = unknownAddresses[i]
      if (domain && addr) map[addr.toLowerCase()] = domain
    }
    return map
  }, [vetDomains, unknownAddresses])

  return (
    <Card.Root w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <Heading size="lg" fontWeight="bold">
            {t("Recent Transfers")}
          </Heading>

          <Wrap gap={2}>
            {FILTER_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                size="xs"
                variant={filter === opt.value ? "solid" : "outline"}
                onClick={() => setFilter(opt.value)}>
                {t(opt.label as "All")}
              </Button>
            ))}
          </Wrap>

          <Skeleton loading={isLoading} rounded="md">
            {filtered.length > 0 ? (
              <VStack gap={3} align="stretch">
                {filtered.map(transaction => (
                  <TreasuryTransferCard
                    key={transaction.id}
                    transaction={transaction}
                    domainMap={domainMap}
                    gmUpgrades={gmUpgrades}
                  />
                ))}
                {hasNextPage && (
                  <Button variant="outline" onClick={() => fetchNextPage()} loading={isFetchingNextPage} mx="auto">
                    {t("Load more")}
                  </Button>
                )}
              </VStack>
            ) : (
              <EmptyState bg="transparent" size="sm" title={t("No transfers found")} icon={<FiAlertCircle />} />
            )}
          </Skeleton>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

const TreasuryTransferCard = ({
  transaction,
  domainMap,
  gmUpgrades,
}: {
  transaction: TreasuryTransfer
  domainMap: Record<string, string>
  gmUpgrades: GMUpgradeMap
}) => {
  const direction = resolveDirection(transaction)
  const isOutgoing = direction === "out"
  const counterparty = formatCounterparty(transaction, direction, domainMap)
  const amount = transaction.value ? humanNumber(formatEther(transaction.value)) : "0"
  const date = new Date(transaction.blockTimestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const label = resolveLabel(transaction, direction, gmUpgrades)
  const explorerLink = getExplorerTxLink(transaction.txId)

  return (
    <Card.Root variant="outline" size="sm">
      <Card.Body py={3} px={4}>
        <HStack justify="space-between" gap={3}>
          <HStack gap={3} flex={1} minW={0}>
            {isOutgoing ? <FiArrowUpRight color="red" /> : <FiArrowDownLeft color="green" />}
            <VStack align="start" gap={0} minW={0}>
              <Text fontWeight="semibold" textStyle="sm" lineClamp={1}>
                {label}
              </Text>
              <Text textStyle="xs" color="text.muted" lineClamp={1}>
                {counterparty}
                {" · "}
                {date}
              </Text>
            </VStack>
          </HStack>
          <HStack gap={2} flexShrink={0}>
            <Text fontWeight="semibold" textStyle="sm" color={isOutgoing ? "red.500" : "green.500"}>
              {isOutgoing ? "-" : "+"}
              {amount}
              {" B3TR"}
            </Text>
            <Link
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              color="fg.muted"
              _hover={{ color: "fg" }}>
              <FiExternalLink />
            </Link>
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}

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

import { useExecutedProposalsByTxId } from "../../../api/contracts/treasury/useProposalIdByTxIds"
import {
  TreasuryTransfer,
  TreasuryTransferCategory,
  useTreasuryTransfers,
} from "../../../api/contracts/treasury/useTreasuryTransfers"

const config = getConfig()
const treasuryAddress = config.treasuryContractAddress.toLowerCase()

const FILTER_OPTIONS: { value: TreasuryTransferCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "out", label: "Out" },
  { value: "emission", label: "Emissions" },
  { value: "surplus", label: "App voting surplus" },
  { value: "gm_upgrade", label: "GM Upgrades" },
  { value: "grant", label: "Grant" },
  { value: "other", label: "Other" },
]

const getCounterpartyAddress = (tx: TreasuryTransfer): string | undefined => {
  if (tx.from.toLowerCase() === treasuryAddress) return tx.to
  return tx.from
}

const shortenVedelegateDomain = (name: string): string => {
  if (!name.includes(".vedelegate.vet")) return name
  const dot = name.indexOf(".")
  if (dot <= 6) return name
  const firstSegment = name.slice(0, dot)
  const rest = name.slice(dot)
  return `${firstSegment.slice(0, 3)}...${firstSegment.slice(-3)}${rest}`
}

export const TreasuryTransfersList = () => {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<TreasuryTransferCategory | "all">("all")
  const category: TreasuryTransferCategory | undefined = filter === "all" ? undefined : filter
  const { data, isLoading, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } = useTreasuryTransfers(
    category,
    5,
  )

  const transactions = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data])

  const { data: proposalByTxId } = useExecutedProposalsByTxId()

  const unknownAddresses = useMemo(() => {
    const set = new Set<string>()
    for (const tx of transactions) {
      if (tx.counterpartyName) continue
      const addr = getCounterpartyAddress(tx)
      if (addr) set.add(addr)
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
            {transactions.length > 0 ? (
              <VStack
                gap={3}
                align="stretch"
                opacity={isFetching && !isFetchingNextPage ? 0.5 : 1}
                transition="opacity 0.15s">
                {transactions.map(transaction => (
                  <TreasuryTransferCard
                    key={transaction.id}
                    transaction={transaction}
                    domainMap={domainMap}
                    proposal={proposalByTxId[transaction.txId.toLowerCase()]}
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
  proposal,
}: {
  transaction: TreasuryTransfer
  domainMap: Record<string, string>
  proposal?: { id: string; title: string; isGrant: boolean }
}) => {
  const isOutgoing = transaction.from.toLowerCase() === treasuryAddress
  const counterpartyAddr = getCounterpartyAddress(transaction)
  const rawCounterparty =
    transaction.counterpartyName ??
    (counterpartyAddr ? (domainMap[counterpartyAddr.toLowerCase()] ?? humanAddress(counterpartyAddr, 6, 4)) : "")
  const counterparty = shortenVedelegateDomain(rawCounterparty)
  const amount = transaction.value ? humanNumber(formatEther(transaction.value)) : "0"
  const date = new Date(transaction.blockTimestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const explorerLink = getExplorerTxLink(transaction.txId)
  const primaryLabel = proposal?.title ?? transaction.label

  return (
    <Card.Root variant="outline" size="sm">
      <Card.Body>
        <HStack justify="space-between" gap={3}>
          <HStack gap={3} flex={1} minW={0}>
            {isOutgoing ? <FiArrowUpRight color="red" /> : <FiArrowDownLeft color="green" />}
            <VStack align="start" gap={0} minW={0}>
              <Text fontWeight="semibold" textStyle="sm" lineClamp={1}>
                {proposal ? (
                  <Link
                    href={proposal.isGrant ? `/grants/${proposal.id}` : `/proposals/${proposal.id}`}
                    variant="underline">
                    {primaryLabel}
                  </Link>
                ) : (
                  primaryLabel
                )}
              </Text>
              <Text textStyle="xs" color="text.muted" lineClamp={1}>
                {counterparty}
                {" · "}
                {date}
              </Text>
            </VStack>
          </HStack>
          <HStack gap={2} flexShrink={0}>
            <Text fontWeight="semibold" textStyle="sm" color={isOutgoing ? "red.500" : "green.500"} truncate>
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

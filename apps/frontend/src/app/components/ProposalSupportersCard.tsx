import {
  Box,
  ButtonGroup,
  Collapsible,
  Grid,
  Icon,
  IconButton,
  Link,
  Pagination,
  SkeletonText,
  Text,
} from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { humanAddress, humanDomain, humanNumber } from "@repo/utils/FormattingUtils"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import dayjs from "dayjs"
import { NavArrowDown, NavArrowLeft, NavArrowRight, NavArrowUp, SortDown, SortUp } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useEvents } from "@/hooks/useEvents"
import { useGetVetDomains } from "@/hooks/useGetVetDomains"

const abi = B3TRGovernor__factory.abi
const contractAddress = getConfig().b3trGovernorAddress as `0x${string}`
const PAGE_SIZE = 5

type AggregatedSupporter = {
  depositor: string
  totalAmount: bigint
  latestTimestamp: number
}

const SupporterTable = ({
  supporters,
  domains,
  isLoading,
  order,
  onOrderToggle,
}: {
  supporters: AggregatedSupporter[]
  domains?: (string | null)[]
  isLoading?: boolean
  order?: "asc" | "desc"
  onOrderToggle?: VoidFunction
}) => {
  const { t } = useTranslation()
  return (
    <Box height="auto" overflowX={{ base: "scroll", md: "unset" }}>
      <Grid
        justifyItems="space-between"
        templateColumns="1fr auto auto"
        gap={3}
        columnGap={{ base: "4", md: "6" }}
        width={{ base: "max-content", md: "100%" }}>
        <Text h="4" fontWeight="semibold" textStyle="xs" color="text.default">
          {t("Supporter")}
        </Text>
        <Text h="4" fontWeight="semibold" textStyle="xs" color="text.default">
          {t("Amount")}
        </Text>
        <IconButton
          variant="ghost"
          size="xs"
          textStyle="xs"
          fontWeight="semibold"
          textAlign="end"
          h="4"
          justifySelf="end"
          onClick={onOrderToggle}>
          {t("Time")}
          <Icon as={order === "asc" ? SortUp : SortDown} boxSize="4" />
        </IconButton>

        {supporters.map((supporter, idx) => (
          <Box key={supporter.depositor} display="contents">
            <Box h="28px" display="flex" alignItems="center">
              {isLoading ? (
                <SkeletonText w="50%" noOfLines={1} />
              ) : (
                <Link href={`/profile/${supporter.depositor}`} color="actions.primary.default" textStyle="sm">
                  {domains?.[idx] ? humanDomain(domains[idx]) : humanAddress(supporter.depositor)}
                </Link>
              )}
            </Box>
            <Box h="28px" display="flex" alignItems="center" color="text.subtle" textStyle="sm">
              {humanNumber(formatEther(supporter.totalAmount), undefined, "VOT3")}
            </Box>
            <Box h="28px" display="flex" alignItems="center" justifyContent="end" color="text.subtle" textStyle="sm">
              {dayjs.unix(supporter.latestTimestamp).fromNow()}
            </Box>
          </Box>
        ))}
      </Grid>
    </Box>
  )
}

export const ProposalSupportersCard = ({ proposalId }: { proposalId: string }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState<"asc" | "desc">("desc")

  const { data: rawDeposits, isLoading: isDepositsLoading } = useEvents({
    abi,
    contractAddress,
    eventName: "ProposalDeposit",
    filterParams: { proposalId: BigInt(proposalId) },
    enabled: open,
  })

  const aggregatedSupporters = useMemo(() => {
    if (!rawDeposits) return []

    const byDepositor = new Map<string, { totalAmount: bigint; latestTimestamp: number }>()
    for (const event of rawDeposits) {
      const addr = (event.decodedData.args.depositor as string).toLowerCase()
      const amount = event.decodedData.args.amount as bigint
      const ts = event.meta.blockTimestamp

      const existing = byDepositor.get(addr)
      if (existing) {
        existing.totalAmount += amount
        if (ts > existing.latestTimestamp) existing.latestTimestamp = ts
      } else {
        byDepositor.set(addr, { totalAmount: amount, latestTimestamp: ts })
      }
    }

    const list: AggregatedSupporter[] = Array.from(byDepositor.entries()).map(([depositor, data]) => ({
      depositor,
      ...data,
    }))

    list.sort((a, b) =>
      order === "desc" ? b.latestTimestamp - a.latestTimestamp : a.latestTimestamp - b.latestTimestamp,
    )

    return list
  }, [rawDeposits, order])

  const paginatedSupporters = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return aggregatedSupporters.slice(start, start + PAGE_SIZE)
  }, [aggregatedSupporters, page])

  const { data: domains, isLoading: isDomainsLoading } = useGetVetDomains(
    paginatedSupporters.map(s => s.depositor as `0x${string}`),
  )

  return (
    <Collapsible.Root w="full" open={open} onOpenChange={e => setOpen(e.open)} bg="card.subtle" rounded="xl" p="6">
      <Collapsible.Trigger w="full" display="flex" justifyContent="space-between" alignItems="center">
        <Text color="text.default" textStyle="md" fontWeight="semibold">
          {t("Supporters")}
        </Text>
        <Collapsible.Indicator>
          <Icon>{open ? <NavArrowUp /> : <NavArrowDown />}</Icon>
        </Collapsible.Indicator>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Box mt="4">
          <SupporterTable
            supporters={paginatedSupporters}
            domains={domains}
            isLoading={isDepositsLoading || isDomainsLoading}
            order={order}
            onOrderToggle={() => {
              if (page !== 1) setPage(1)
              setOrder(old => (old === "asc" ? "desc" : "asc"))
            }}
          />
        </Box>
        {aggregatedSupporters.length > PAGE_SIZE && (
          <Pagination.Root
            mx={{ base: "auto", md: "unset" }}
            mt="6"
            count={aggregatedSupporters.length}
            pageSize={PAGE_SIZE}
            page={page}
            display="flex"
            flexWrap="wrap"
            alignItems="center"
            justifyContent="space-between"
            gap="4"
            siblingCount={1}
            onPageChange={p => setPage(p.page)}>
            <Pagination.PageText format="compact" textStyle="sm" />
            <ButtonGroup variant="ghost" size="xs" flexWrap="wrap">
              <Pagination.PrevTrigger asChild>
                <IconButton>
                  <NavArrowLeft />
                </IconButton>
              </Pagination.PrevTrigger>
              <Pagination.Items
                render={p => (
                  <IconButton rounded="full" variant={{ base: "ghost", _selected: "surface" }}>
                    {p.value}
                  </IconButton>
                )}
              />
              <Pagination.NextTrigger asChild>
                <IconButton>
                  <NavArrowRight />
                </IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
        )}
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

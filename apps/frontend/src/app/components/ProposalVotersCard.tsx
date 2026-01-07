import {
  ButtonGroup,
  Collapsible,
  HStack,
  Icon,
  IconButton,
  Link,
  Pagination,
  SkeletonText,
  Table,
  Text,
} from "@chakra-ui/react"
import { humanAddress, humanDomain, humanNumber } from "@repo/utils/FormattingUtils"
import { isValidAddress } from "@vechain/vechain-kit/utils"
import dayjs from "dayjs"
import { t } from "i18next"
import { ArrowSeparateVertical, NavArrowDown, NavArrowLeft, NavArrowRight, NavArrowUp } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useProposalVoteEvents } from "@/api/contracts/governance/hooks/useProposalVoteEvents"
import { mapSupportToVoteType } from "@/api/contracts/governance/hooks/useUserProposalsVoteEvents"
import AbstainIcon from "@/components/Icons/svg/abstain.svg"
import ThumbsDownIcon from "@/components/Icons/svg/thumbs-down.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import { SearchField } from "@/components/SearchField/SearchField"
import { useDebounce } from "@/hooks/useDebounce"
import { useGetVetDomains, useGetAddressFromVetDomains } from "@/hooks/useGetVetDomains"

const VOTE_OPTION_CONFIG = {
  FOR: { icon: ThumbsUpIcon, label: "Approve", color: "status.positive.primary" },
  AGAINST: { icon: ThumbsDownIcon, label: "Against", color: "status.negative.strong" },
  ABSTAIN: { icon: AbstainIcon, label: "Abstained", color: "status.warning.strong" },
} as const

const isValidVetDomain = (term: string) => !term.startsWith("0x") && term.endsWith(".vet")

type Voter = {
  voter: `0x${string}`
  proposalId: bigint
  support: number
  weight: bigint
  power: bigint
  reason: string
  blockTimestamp: number
}

const VoteOptionBadge = ({ support }: { support: number }) => {
  const voteOption = mapSupportToVoteType(support)

  if (!voteOption) return null

  const config = VOTE_OPTION_CONFIG[voteOption]
  return (
    <HStack
      bg="bg.primary"
      borderWidth="1px"
      borderColor={config.color}
      borderRadius="lg"
      px={3}
      py={1}
      gap={1}
      justify="center">
      <Icon as={config.icon} color={config.color} boxSize={4} />
      <Text textStyle="sm" color={config.color}>
        {config.label}
      </Text>
    </HStack>
  )
}

const VoterTable = ({
  voters,
  domains,
  isLoading,
  onOrderToggle,
}: {
  voters?: Voter[]
  domains?: (string | null)[]
  isLoading?: boolean
  onOrderToggle?: VoidFunction
}) => {
  const { t } = useTranslation()
  return (
    <Table.Root size="sm" mt={4} tableLayout="fixed" borderCollapse="separate">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader fontWeight="semibold" textStyle="xs">
            {t("Voter")}
          </Table.ColumnHeader>
          <Table.ColumnHeader w="20%" fontWeight="semibold" textStyle="xs">
            {t("Voting Power")}
          </Table.ColumnHeader>
          <Table.ColumnHeader fontWeight="semibold" textStyle="xs">
            {t("Voted Option")}
          </Table.ColumnHeader>
          <Table.ColumnHeader w="20%" fontWeight="semibold" textStyle="xs" alignItems="center">
            {t("Voting Time")}
            <IconButton ml="0.5" size="xs" unstyled onClick={onOrderToggle}>
              <Icon as={ArrowSeparateVertical} size="sm" />
            </IconButton>
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {voters?.map((voter, idx) => (
          <Table.Row key={voter.voter}>
            <Table.Cell>
              {isLoading ? (
                <SkeletonText w="50%" noOfLines={1} />
              ) : (
                <Link href={`/profile/${voter.voter}`} color="actions.primary.default" textStyle="sm">
                  {domains?.[idx] ? humanDomain(domains[idx]) : humanAddress(voter?.voter || "")}
                </Link>
              )}
            </Table.Cell>
            <Table.Cell color="text.subtle" textStyle="sm">
              {voter?.power ? humanNumber(formatEther(voter?.power)) : "-"}
            </Table.Cell>
            <Table.Cell>
              <VoteOptionBadge support={voter?.support} />
            </Table.Cell>
            <Table.Cell color="text.subtle" textStyle="sm">
              {dayjs.unix(voter?.blockTimestamp ?? 0).fromNow()}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

export const ProposalVotersCard = ({ proposalId, totalVoters }: { proposalId: string; totalVoters?: number }) => {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState<"asc" | "desc">("asc")

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const isDomain = useMemo(() => isValidVetDomain(debouncedSearchTerm), [debouncedSearchTerm])
  const { data: [userAddress] = [] } = useGetAddressFromVetDomains(isDomain ? [debouncedSearchTerm] : undefined)
  const voter = useMemo(() => {
    if (isValidAddress(debouncedSearchTerm)) {
      return debouncedSearchTerm as `0x${string}`
    }
    if (isDomain && userAddress) {
      return userAddress.toLowerCase() as `0x${string}`
    }
    return undefined
  }, [debouncedSearchTerm, isDomain, userAddress])

  const { data: voteEvents, isLoading: isVoteEventsLoading } = useProposalVoteEvents({
    proposalId,
    voter,
    page: page - 1,
    order,
  })
  const { data: domains, isLoading: isDomainsLoading } = useGetVetDomains(
    voteEvents?.map(vote => vote.decodedData.args.voter || `0x`),
  )
  const voters = voteEvents?.map(event => ({ ...event.decodedData.args, blockTimestamp: event.meta.blockTimestamp }))

  return (
    <Collapsible.Root w="full" open={open} onOpenChange={e => setOpen(e.open)} bg="card.subtle" rounded="xl" p="6">
      <Collapsible.Trigger w="full" display="flex" justifyContent="space-between" alignItems="center">
        <Text color="text.default" textStyle="md" fontWeight="semibold">
          {t("Voters")}
        </Text>
        <Collapsible.Indicator>
          <Icon>{open ? <NavArrowUp /> : <NavArrowDown />}</Icon>
        </Collapsible.Indicator>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <SearchField
          inputWrapperProps={{ p: "0.5", mt: "4" }}
          inputProps={{ minW: "200px", flex: 1 }}
          placeholder={"Search voter address or domain"}
          value={searchTerm}
          onChange={term => {
            if (page !== 1) setPage(1)
            setSearchTerm(term)
          }}
        />
        <VoterTable
          voters={voters}
          domains={domains}
          isLoading={isVoteEventsLoading || isDomainsLoading}
          onOrderToggle={() => {
            if (page !== 1) setPage(1)
            setOrder(old => (old === "asc" ? "desc" : "asc"))
          }}
        />
        <Pagination.Root
          mx={{ base: "auto", md: "unset" }}
          mt="2"
          count={voter ? 1 : totalVoters}
          pageSize={5}
          page={page}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap="4"
          siblingCount={1}
          onPageChange={page => setPage(page.page)}>
          <Pagination.PageText format="compact" textStyle="sm" />
          <ButtonGroup variant="ghost" size="xs">
            <Pagination.PrevTrigger asChild>
              <IconButton>
                <NavArrowLeft />
              </IconButton>
            </Pagination.PrevTrigger>
            <Pagination.Items
              render={page => (
                <IconButton rounded="full" variant={{ base: "ghost", _selected: "surface" }}>
                  {page.value}
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
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

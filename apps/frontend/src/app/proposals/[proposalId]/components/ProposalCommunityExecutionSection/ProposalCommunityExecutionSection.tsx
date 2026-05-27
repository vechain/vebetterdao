import { Avatar, Badge, Box, Flex, HStack, Heading, Icon, Link, Text, Tooltip, VStack } from "@chakra-ui/react"
import { ethers } from "ethers"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuExternalLink } from "react-icons/lu"

import { useIsProposalPaid } from "@/api/contracts/governance/hooks/useIsProposalPaid"
import { useProposalBudget } from "@/api/contracts/governance/hooks/useProposalBudget"
import { useProposalContributors } from "@/api/contracts/governance/hooks/useProposalContributors"
import { useProposalDescription } from "@/api/contracts/governance/hooks/useProposalDescription"
import { useProposalImplementationDiscussion } from "@/api/contracts/governance/hooks/useProposalImplementationDiscussion"
import { useProposalPayee } from "@/api/contracts/governance/hooks/useProposalPayee"
import { useProposalState } from "@/api/contracts/governance/hooks/useProposalState"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture/AddressWithProfilePicture"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { useProposalPayoutClaimedEvent } from "@/hooks/proposals/common/useProposalPayoutClaimedEvent"
import { ProposalState } from "@/hooks/proposals/grants/types"
import { useMainnetB3TRPrice } from "@/hooks/useMainnetB3TRPrice"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

type Props = {
  proposalId: string
}

const ZERO = ethers.ZeroAddress.toLowerCase()
const formatB3TR = (wei: bigint) =>
  Number(ethers.formatEther(wei)).toLocaleString(undefined, { maximumFractionDigits: 4 })

type ParsedContributor = {
  raw: string
  handle: string
  url?: string
  avatar?: string
  source: "github" | "twitter" | "other"
}

const parseContributor = (raw: string): ParsedContributor => {
  const trimmed = raw.trim()
  if (!trimmed) return { raw, handle: "", source: "other" }

  // URL forms
  try {
    const url = new URL(trimmed)
    const host = url.hostname.toLowerCase()
    const seg = url.pathname.split("/").filter(Boolean)[0] ?? ""
    if (host.includes("github.com") && seg) {
      return {
        raw,
        handle: seg,
        url: trimmed,
        avatar: `https://github.com/${seg}.png`,
        source: "github",
      }
    }
    if ((host === "twitter.com" || host === "x.com" || host.endsWith(".x.com")) && seg) {
      return { raw, handle: `@${seg}`, url: trimmed, source: "twitter" }
    }
    return { raw, handle: url.hostname, url: trimmed, source: "other" }
  } catch {
    // not a URL — fall through
  }

  // "github:alice", "gh:alice", "twitter:bob", "tw:@bob", "@bob"
  const lower = trimmed.toLowerCase()
  if (lower.startsWith("github:") || lower.startsWith("gh:")) {
    const handle = trimmed.split(":")[1] ?? ""
    return {
      raw,
      handle,
      url: handle ? `https://github.com/${handle}` : undefined,
      avatar: handle ? `https://github.com/${handle}.png` : undefined,
      source: "github",
    }
  }
  if (lower.startsWith("twitter:") || lower.startsWith("tw:") || lower.startsWith("x:")) {
    const handle = trimmed.split(":")[1] ?? ""
    const clean = handle.replace(/^@/, "")
    return {
      raw,
      handle: `@${clean}`,
      url: clean ? `https://x.com/${clean}` : undefined,
      source: "twitter",
    }
  }
  if (trimmed.startsWith("@")) {
    const clean = trimmed.slice(1)
    return { raw, handle: trimmed, url: clean ? `https://x.com/${clean}` : undefined, source: "twitter" }
  }
  return { raw, handle: trimmed, source: "other" }
}

/**
 * V11 Community Execution section on the proposal detail page.
 * Renders the implementation cost, the single payout address, description, link to the
 * implementation discussion, and a row of contributor avatars (GitHub-style).
 */
export const ProposalCommunityExecutionSection = ({ proposalId }: Props) => {
  const { t } = useTranslation()
  const { data: maxBudget } = useProposalBudget(proposalId)
  const { data: payee } = useProposalPayee(proposalId)
  const { data: paid } = useIsProposalPaid(proposalId)
  const { data: stateRaw } = useProposalState(proposalId)
  const state = Number(stateRaw ?? -1) as ProposalState
  const isCompleted = state === ProposalState.Completed
  const { data: description } = useProposalDescription(proposalId)
  const { data: implementationDiscussion } = useProposalImplementationDiscussion(proposalId)
  const { data: contributorsRaw } = useProposalContributors(proposalId)
  const { data: b3trUsdPrice } = useMainnetB3TRPrice()
  const { data: payoutClaimedEvents } = useProposalPayoutClaimedEvent(proposalId)
  const payoutTxId = payoutClaimedEvents?.[0]?.txID

  const hasBudget = !!maxBudget && maxBudget > 0n
  const hasPayee = !!payee && payee.toLowerCase() !== ZERO
  const hasDescription = !!description && description.length > 0
  const hasDiscussion = !!implementationDiscussion && implementationDiscussion.length > 0
  const contributors = useMemo(() => (contributorsRaw ?? []).map(parseContributor), [contributorsRaw])

  const budgetUsd = useMemo(() => {
    if (!hasBudget) return undefined
    const price = Number(b3trUsdPrice)
    if (!Number.isFinite(price) || price <= 0) return undefined
    return Number(ethers.formatEther(maxBudget)) * price
  }, [hasBudget, maxBudget, b3trUsdPrice])

  if (!hasBudget && !hasPayee && !hasDescription && !hasDiscussion && contributors.length === 0) {
    return null
  }

  return (
    <VStack align="flex-start" w="full" gap={4}>
      {/* Match the visual style of the markdown "## Proposal Summary" / "## Proposal Type" headings
          rendered inside the same card. MDEditor.Markdown uses github-style h2: ~1.5em bold with a
          1px bottom border. */}
      <Heading
        as="h2"
        size="xl"
        fontWeight="semibold"
        w="full"
        pb={2}
        borderBottom="1px solid"
        borderColor="border.primary">
        {t("Development Details")}
      </Heading>
      <VStack gap={5} align="flex-start" w="full">
        {hasBudget && (
          <Box>
            <Text fontWeight="semibold">{t("Cost")}</Text>
            <HStack gap={3} align="center" mt={1}>
              <B3TRIcon boxSize={6} colorVariant="dark" />
              <Heading size={["md", "md", "lg"]}>{`${formatB3TR(maxBudget)} B3TR`}</Heading>
              {budgetUsd !== undefined && (
                <Text textStyle="md" color="gray.500">
                  {`≈ $${budgetUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                </Text>
              )}
              {paid ? (
                payoutTxId ? (
                  <Link
                    href={getExplorerTxLink(payoutTxId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("View payout transaction on the explorer")}>
                    <Badge colorPalette="green" variant="subtle" gap={1}>
                      {t("Paid")}
                      <Icon as={LuExternalLink} boxSize={3} />
                    </Badge>
                  </Link>
                ) : (
                  <Badge colorPalette="green" variant="subtle">
                    {t("Paid")}
                  </Badge>
                )
              ) : isCompleted ? (
                <Badge colorPalette="gray" variant="subtle">
                  {t("Pending payment")}
                </Badge>
              ) : null}
            </HStack>
          </Box>
        )}

        {hasPayee && (
          <Box>
            <Text fontWeight="semibold">{t("Payout address")}</Text>
            <Box mt={1}>
              <AddressWithProfilePicture address={payee as string} />
            </Box>
          </Box>
        )}

        {hasDescription && (
          <Box>
            <Text fontWeight="semibold">{t("Description")}</Text>
            <Text textStyle="md">{description}</Text>
          </Box>
        )}

        {hasDiscussion && (
          <Box>
            <Text fontWeight="semibold">{t("Implementation discussion")}</Text>
            <Link
              href={implementationDiscussion}
              target="_blank"
              rel="noopener noreferrer"
              variant="underline"
              wordBreak="break-all">
              {implementationDiscussion}
            </Link>
          </Box>
        )}

        {contributors.length > 0 && (
          <VStack gap={2} align="flex-start" w="full">
            <HStack gap={2} align="center">
              <Text fontWeight="semibold">{t("Contributors")}</Text>
              <Badge colorPalette="gray" variant="subtle">
                {contributors.length}
              </Badge>
            </HStack>
            <Flex wrap="wrap" gap={2}>
              {contributors.map((c, idx) => {
                const node = (
                  <Avatar.Root size="md" colorPalette="gray">
                    {c.avatar ? <Avatar.Image src={c.avatar} alt={c.handle} /> : null}
                    <Avatar.Fallback>{(c.handle || "?").slice(0, 2).toUpperCase()}</Avatar.Fallback>
                  </Avatar.Root>
                )
                return (
                  <Tooltip.Root key={`${c.raw}-${idx}`}>
                    <Tooltip.Trigger asChild>
                      {c.url ? (
                        <Link href={c.url} target="_blank" rel="noopener noreferrer" aria-label={c.handle}>
                          {node}
                        </Link>
                      ) : (
                        node
                      )}
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Content>{c.handle || c.raw}</Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                )
              })}
            </Flex>
          </VStack>
        )}
      </VStack>
    </VStack>
  )
}

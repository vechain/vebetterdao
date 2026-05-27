import { Avatar, Badge, Box, Flex, HStack, Heading, Link, Stack, Text, Tooltip, VStack } from "@chakra-ui/react"
import { ethers } from "ethers"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useIsProposalPaid } from "@/api/contracts/governance/hooks/useIsProposalPaid"
import { useProposalBudget } from "@/api/contracts/governance/hooks/useProposalBudget"
import { useProposalContributors } from "@/api/contracts/governance/hooks/useProposalContributors"
import { useProposalDescription } from "@/api/contracts/governance/hooks/useProposalDescription"
import { useProposalImplementationDiscussion } from "@/api/contracts/governance/hooks/useProposalImplementationDiscussion"
import { useProposalPayee } from "@/api/contracts/governance/hooks/useProposalPayee"
import { useProposalState } from "@/api/contracts/governance/hooks/useProposalState"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture/AddressWithProfilePicture"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { ProposalState } from "@/hooks/proposals/grants/types"
import { useMainnetB3TRPrice } from "@/hooks/useMainnetB3TRPrice"

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
        {t("Implementation cost")}
      </Heading>
      <VStack gap={5} align="flex-start" w="full">
        {hasBudget && (
          <VStack gap={2} align="flex-start" w="full">
            <HStack gap={3} align="center">
              <B3TRIcon boxSize={6} colorVariant="dark" />
              <Heading size={["md", "md", "lg"]}>{`${formatB3TR(maxBudget)} B3TR`}</Heading>
              {budgetUsd !== undefined && (
                <Text textStyle="md" color="gray.500">
                  {`≈ $${budgetUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                </Text>
              )}
              {paid ? (
                <Badge colorPalette="green" variant="subtle">
                  {t("Paid")}
                </Badge>
              ) : isCompleted ? (
                <Badge colorPalette="gray" variant="subtle">
                  {t("Pending")}
                </Badge>
              ) : null}
            </HStack>
            <Text textStyle="sm" color="gray.500">
              {t("Treasury funds used to pay the team working on implementing this proposal.")}
            </Text>
          </VStack>
        )}

        {hasPayee && (
          <Stack
            direction={["column", "row"]}
            justify="space-between"
            align={["flex-start", "center"]}
            bg="b3tr-balance-bg"
            p={3}
            borderRadius="md"
            w="full"
            gap={3}>
            <VStack align="flex-start" gap={0}>
              <Text textStyle="xs" color="gray.500">
                {t("Payout address")}
              </Text>
              <AddressWithProfilePicture address={payee as string} />
            </VStack>
            <Text textStyle="sm" color="gray.500" maxW={["full", "60%"]}>
              {t(
                "Receives the full implementation cost when the payout is claimed. Responsible for distributing funds to contributors off chain.",
              )}
            </Text>
          </Stack>
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

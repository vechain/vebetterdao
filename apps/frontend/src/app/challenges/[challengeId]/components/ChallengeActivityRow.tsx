import { Box, HStack, Link, Text } from "@chakra-ui/react"
import { humanAddress, humanDomain, humanNumber } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { type ChallengeView, SettlementMode } from "@/api/challenges/types"
import { type ChallengeActivityEntry, type ActivityEntryType } from "@/api/challenges/useChallengeActivityLog"
import dayjs from "@/utils/dayjsConfig"

import { getChallengeInvalidReason } from "../../shared/challengeInvalidReason"

const textColor: Record<ActivityEntryType, string> = {
  created: "blue.500",
  invited: "text.subtle",
  joined: "green.500",
  accepted: "green.500",
  declined: "orange.500",
  left: "orange.500",
  cancelled: "red.500",
  activated: "green.500",
  invalidated: "red.500",
  completed: "yellow.500",
  payoutClaimed: "green.500",
  splitWinPrizeClaimed: "green.500",
  splitWinCreatorRefunded: "text.subtle",
  refundClaimed: "text.subtle",
}

const ActivityName = ({ address }: { address: string }) => {
  const { data: vnsData } = useVechainDomain(address)
  const domain = vnsData?.domain
  return (
    <Link asChild variant="underline" fontWeight="semibold" display="inline">
      <NextLink href={`/profile/${address}`}>
        {domain ? humanDomain(domain, 18, 6) : humanAddress(address, 6, 4)}
      </NextLink>
    </Link>
  )
}

interface ChallengeActivityRowProps {
  entry: ChallengeActivityEntry
  challenge?: Pick<ChallengeView, "status" | "kind" | "participantCount">
}

export const ChallengeActivityRow = ({ entry, challenge }: ChallengeActivityRowProps) => {
  const { t } = useTranslation()
  const formattedAmount = entry.amount ? humanNumber(entry.amount) : undefined

  const label = getActivityLabel(entry.type, formattedAmount, t as (key: string, opts?: object) => string)
  const completedLabel = getCompletedLabel(entry, t as (key: string, opts?: object) => string)
  const invalidReason = entry.type === "invalidated" && challenge ? getChallengeInvalidReason(challenge, t) : null
  const relativeTime = dayjs.unix(entry.timestamp).fromNow()
  const color = textColor[entry.type]

  return (
    <HStack w="full" gap="3" align="flex-start" py="2">
      <Box flex={1} minW={0}>
        <Text textStyle="sm" color={color} lineClamp={2}>
          {entry.address ? (
            <>
              <ActivityName address={entry.address} /> {label}
            </>
          ) : (
            label
          )}
        </Text>
        {completedLabel && (
          <Text textStyle="xs" color="text.subtle">
            {completedLabel}
          </Text>
        )}
        {invalidReason && (
          <Text textStyle="xs" color="text.subtle">
            {invalidReason}
          </Text>
        )}
      </Box>

      <Text textStyle="xs" color="text.subtle" flexShrink={0} whiteSpace="nowrap" pt="0.5">
        {relativeTime}
      </Text>
    </HStack>
  )
}

type TFn = (key: string, opts?: object) => string
const noEscape = { interpolation: { escapeValue: false } }

const getActivityLabel = (type: ActivityEntryType, formattedAmount: string | undefined, t: TFn): string => {
  switch (type) {
    case "created":
      return t("created the quest")
    case "invited":
      return t("was invited")
    case "joined":
      return formattedAmount
        ? t("joined betting {{amount}} B3TR", { amount: formattedAmount, ...noEscape })
        : t("joined")
    case "accepted":
      return formattedAmount
        ? t("accepted the invite betting {{amount}} B3TR", { amount: formattedAmount, ...noEscape })
        : t("accepted the invite")
    case "declined":
      return t("declined the invite")
    case "left":
      return t("left the quest")
    case "cancelled":
      return t("Creator cancelled the quest")
    case "activated":
      return t("Quest started")
    case "invalidated":
      return t("Quest could not start")
    case "completed":
      return t("Quest ended")
    case "payoutClaimed":
      return t("claimed prize of {{amount}} B3TR", { amount: formattedAmount ?? "0", ...noEscape })
    case "splitWinPrizeClaimed":
      return t("claimed Split Win slot of {{amount}} B3TR", { amount: formattedAmount ?? "0", ...noEscape })
    case "splitWinCreatorRefunded":
      return t("refunded {{amount}} B3TR from unclaimed slots", { amount: formattedAmount ?? "0", ...noEscape })
    case "refundClaimed":
      return t("claimed refund of {{amount}} B3TR", { amount: formattedAmount ?? "0", ...noEscape })
  }
}

const getCompletedLabel = (entry: ChallengeActivityEntry, t: TFn): string | null => {
  if (entry.type !== "completed") return null

  if (entry.settlementMode === SettlementMode.CreatorRefund) return t("No winner — refunded to creator")
  if (entry.settlementMode === SettlementMode.SplitWinCompleted) return t("Split Win quest completed")

  const count = entry.bestCount ?? 0
  return count === 1 ? t("1 winner selected") : t("{{count}} winners selected", { count })
}

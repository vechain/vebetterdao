"use client"
import { useAllocationsRound, useIsQuadraticFundingDisabled, useTotalVotesOnBlock } from "@/api"
import { ResponsiveCard, VOT3Icon } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { useBreakpoints } from "@/hooks"
import { VStack, Heading, Box, HStack, Skeleton, Text, Icon } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { Trans, useTranslation } from "react-i18next"
import { FaQuestionCircle } from "react-icons/fa"

const compactFormatter = getCompactFormatter(2)
type Props = {
  roundId: string
}

export const YourVoteBalanceCard = ({ roundId }: Props) => {
  const { isDesktop } = useBreakpoints()
  const { account } = useWallet()
  const { t } = useTranslation()
  const { data: roundInfo } = useAllocationsRound(roundId)

  const totalVotesAtSnapshotQuery = useTotalVotesOnBlock(
    roundInfo.voteStart ? Number(roundInfo.voteStart) : undefined,
    account?.address ?? "",
  )
  const votesAtSnapshot = totalVotesAtSnapshotQuery.data?.totalVotesWithDeposits
  const depositsVotes = totalVotesAtSnapshotQuery.data?.depositsVotes
  const votesAtSnapshotLoading = totalVotesAtSnapshotQuery.isLoading

  const { data: isQuadraticFundingDisabled } = useIsQuadraticFundingDisabled()

  return (
    <ResponsiveCard>
      <VStack gap={8} align="flex-start">
        {isDesktop && <Heading size="2xl">{t("Your V0T3 balance")}</Heading>}
        <VStack w="full" align="flex-start">
          <HStack gap={2}>
            <VOT3Icon boxSize={["28px"]} colorVariant="dark" />
            <Skeleton loading={votesAtSnapshotLoading}>
              <Heading size="3xl">{compactFormatter.format(Number(votesAtSnapshot))}</Heading>
            </Skeleton>
          </HStack>
          <HStack>
            <Text textStyle="sm" color="text.subtle">
              {t("VOT3 balance at snapshot")}
            </Text>
            {depositsVotes && (
              <Tooltip
                disabled={depositsVotes === "0"}
                content={
                  <Text>
                    <Trans
                      i18nKey="Includes <bold>{{depositsVotes}} VOT3</bold> from supporting proposals"
                      values={{ depositsVotes: FormattingUtils.humanNumber(Number(depositsVotes ?? 0)) }}
                      components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                    />
                  </Text>
                }>
                <span>
                  <Icon as={FaQuestionCircle} boxSize="3.5" color="#A0A0A0" />
                </span>
              </Tooltip>
            )}
          </HStack>
        </VStack>
        {isDesktop && !isQuadraticFundingDisabled && (
          <Box textStyle="sm" color={"#6A6A6A"}>
            <Text fontWeight="semibold">{t("We use the quadratic formula to calculate the results")}</Text>
            <Text>
              {t(
                "To aim for the equality of the voting process, we use quadratic voting, which divide your total amount of VOT3 for the square root.",
              )}
            </Text>
          </Box>
        )}
      </VStack>
    </ResponsiveCard>
  )
}

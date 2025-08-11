"use client"
import { useAllocationsRound, useIsQuadraticFundingDisabled, useTotalVotesOnBlock } from "@/api"
import { ResponsiveCard, VOT3Icon } from "@/components"
import { useBreakpoints } from "@/hooks"
import { VStack, Heading, Box, HStack, Skeleton, Text } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { Trans, useTranslation } from "react-i18next"

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
      <VStack spacing={8} align="flex-start">
        {isDesktop && (
          <Heading fontSize="24px" fontWeight={700}>
            {t("Your V0T3 balance")}
          </Heading>
        )}
        <VStack w="full" align="flex-start">
          <HStack spacing={2}>
            <VOT3Icon boxSize={["28px"]} colorVariant="dark" />
            <Skeleton isLoaded={!votesAtSnapshotLoading}>
              <Heading fontSize={["28px"]} fontWeight={700}>
                {compactFormatter.format(Number(votesAtSnapshot))}
              </Heading>
            </Skeleton>
          </HStack>
          <Text fontSize="14px" fontWeight={400} color="#6A6A6A">
            {t("VOT3 balance at snapshot")}
          </Text>
          {depositsVotes && (
            <Text fontSize={14}>
              <Trans
                i18nKey="Includes <bold>{{depositsVotes}} VOT3</bold> from supporting proposals"
                values={{ depositsVotes: FormattingUtils.humanNumber(Number(depositsVotes ?? 0)) }}
                components={{ bold: <Text as="span" fontWeight={"600"} /> }}
              />
            </Text>
          )}
        </VStack>
        {isDesktop && !isQuadraticFundingDisabled && (
          <Box fontSize={"14px"} color={"#6A6A6A"} fontWeight={400}>
            <Text fontWeight={600}>{t("We use the quadratic formula to calculate the results")}</Text>
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

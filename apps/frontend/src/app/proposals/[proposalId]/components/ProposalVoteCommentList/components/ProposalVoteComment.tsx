import { ProposalComment, VoteType } from "@/api"
import { AddressIcon } from "@/components/AddressIcon"
import { Card, Separator, HStack, Text, VStack, Stat } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ethers } from "ethers"
import { useVechainDomain } from "@vechain/vechain-kit"

const compactFormatter = getCompactFormatter(2)

export const ProposalVoteComment = ({ vote }: { vote: ProposalComment }) => {
  const { t } = useTranslation()
  const { data: vnsVoterData } = useVechainDomain(vote.voter)
  const accountName = vnsVoterData?.domain

  const voteType = vote.support

  const borderColor = useMemo(
    () =>
      ({
        [VoteType.VOTE_AGAINST]: "#B3D88B",
        [VoteType.VOTE_FOR]: "#CBFFD6",
        [VoteType.ABSTAIN]: "#B59525",
      })[voteType],
    [voteType],
  )

  const bgColor = useMemo(
    () =>
      ({
        [VoteType.VOTE_AGAINST]: "#FFFBFB",
        [VoteType.VOTE_FOR]: "#F2FFE4",
        [VoteType.ABSTAIN]: "#B5952511",
      })[voteType],
    [voteType],
  )

  const textColor = useMemo(
    () =>
      ({
        [VoteType.VOTE_AGAINST]: "#591212",
        [VoteType.VOTE_FOR]: "#1F4325",
        [VoteType.ABSTAIN]: "#B59525",
      })[voteType],
    [voteType],
  )
  const voteLabel = useMemo(
    () =>
      ({
        [VoteType.VOTE_AGAINST]: t("Vote for no"),
        [VoteType.VOTE_FOR]: t("Vote for yes"),
        [VoteType.ABSTAIN]: t("Abstain"),
      })[voteType],
    [t, voteType],
  )

  const votePower = ethers.formatEther(BigInt(vote.power || 0))

  return (
    <Card.Root key={vote.voter} p={4} borderRadius={"6px"} bg={bgColor} borderColor={borderColor}>
      <VStack alignItems="stretch" gap={4}>
        <HStack justify={"space-between"} align={"baseline"}>
          <Text color={textColor} textStyle="xl" fontWeight="semibold">
            {voteLabel}
          </Text>
          <Text color={textColor} textStyle="sm">
            {dayjs(vote.blockTimestamp * 1000).fromNow()}
          </Text>
        </HStack>
        {vote.reason && <Text color={textColor}>{vote.reason}</Text>}
        <Separator color={textColor} />
        <Stat.Root gap={0}>
          <Stat.Label color={textColor}>{t("Voting power")}</Stat.Label>
          <Stat.ValueText alignItems="center">
            <Text color={textColor} textStyle="3xl" fontWeight="semibold">
              {compactFormatter.format(Number(votePower))}
            </Text>
          </Stat.ValueText>
        </Stat.Root>

        <HStack align={"center"}>
          <AddressIcon address={vote.voter} boxSize={4} minW={4} minH={4} rounded={"full"} />
          <Text lineClamp={1} color={textColor}>
            {accountName || humanAddress(vote.voter, 4, 6)}
          </Text>
        </HStack>
      </VStack>
    </Card.Root>
  )
}

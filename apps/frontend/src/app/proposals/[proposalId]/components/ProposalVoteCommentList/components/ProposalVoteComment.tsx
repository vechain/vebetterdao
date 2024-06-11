import { ProposalVoteEvent, VoteType } from "@/api"
import { AddressIcon } from "@/components/AddressIcon"
import { Card, Divider, HStack, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ethers } from "ethers"

const compactFormatter = getCompactFormatter(2)

export const ProposalVoteComment = ({ vote }: { vote: ProposalVoteEvent }) => {
  const { t } = useTranslation()

  const voteType = Number(vote.support) as VoteType

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
    <Card key={vote.account} p={"24px"} borderRadius={"6px"} bg={bgColor} borderColor={borderColor}>
      <VStack alignItems="stretch" gap={4}>
        <HStack justify={"space-between"} align={"baseline"}>
          <Text color={textColor} fontSize={"20px"} fontWeight={600}>
            {voteLabel}
          </Text>
          <Text color={textColor} fontSize={"14px"}>
            {dayjs(vote.blockMeta.blockTimestamp * 1000).fromNow()}
          </Text>
        </HStack>
        {vote.reason && <Text color={textColor}>{vote.reason}</Text>}
        <Divider color={textColor} />
        <HStack justify={"space-between"}>
          <VStack alignItems={"flex-start"}>
            <Text color={textColor}>{t("Voting power")}</Text>
            <HStack align={"baseline"}>
              <Text color={textColor} fontSize={"32px"} fontWeight={600}>
                {compactFormatter.format(Number(votePower))}
              </Text>
              <Text color={textColor} fontSize={"20px"} fontWeight={600}>
                {t("VOT3")}
              </Text>
            </HStack>
          </VStack>
          <HStack align={"center"}>
            <AddressIcon address={vote.account} w="48px" h="48px" rounded="full" />
            <Text color={textColor} fontSize={"14px"}>
              {humanAddress(vote.account, 7, 4)}
            </Text>
          </HStack>
        </HStack>
      </VStack>
    </Card>
  )
}

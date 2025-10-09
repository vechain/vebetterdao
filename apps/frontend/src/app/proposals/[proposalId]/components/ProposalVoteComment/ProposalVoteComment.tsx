import { Card, HStack, Icon, Separator, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"

import { AddressWithProfilePicture } from "../../../../components/AddressWithProfilePicture/AddressWithProfilePicture"
import { ProposalComment } from "../../../../../api/indexer/proposals/useProposalComments"

import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import ThumbsDownIcon from "@/components/Icons/svg/thumbs-down.svg"
import AbstainIcon from "@/components/Icons/svg/abstain.svg"

const compactFormatter = getCompactFormatter(2)
export const ProposalVoteComment = ({ vote }: { vote: ProposalComment }) => {
  const { t } = useTranslation()
  const voteLabel = {
    FOR: { icon: ThumbsUpIcon, label: t("Approved"), color: "status.positive.primary" },
    ABSTAIN: { icon: AbstainIcon, label: t("Abstain"), color: "status.warning.primary" },
    AGAINST: { icon: ThumbsDownIcon, label: t("Against"), color: "status.negative.primary" },
  }
  const voteType = vote.support
  const votePower = ethers.formatEther(BigInt(vote.power || 0))
  return (
    <Card.Root key={vote.voter} variant="primary" p={"32px"} borderRadius={"16px"}>
      <VStack alignItems="stretch" gap={4}>
        <HStack justify={"space-between"} align={"top"}>
          <HStack fontWeight={"semibold"}>
            <Icon as={voteLabel[voteType].icon} color={voteLabel[voteType].color} boxSize={5} />
            <Text textStyle={"lg"} color={voteLabel[voteType].color}>
              {voteLabel[voteType].label}
            </Text>
          </HStack>
          <Text color={"text.subtle"}>{dayjs(vote.blockTimestamp * 1000).fromNow()}</Text>
        </HStack>
        {vote.reason && <Text>{vote.reason}</Text>}
        <HStack color="text.subtle" w="full" gap={4}>
          <HStack>
            <Text>{t("By :")}</Text>
            <AddressWithProfilePicture address={vote.voter} />
          </HStack>
          <Separator orientation="vertical" h="4" />
          <Text>
            {t("Voting Power: {{votingPower}}", {
              votingPower: compactFormatter.format(Number(votePower)),
            })}
          </Text>
        </HStack>
      </VStack>
    </Card.Root>
  )
}

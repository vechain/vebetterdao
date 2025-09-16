import { ProposalComment } from "@/api"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture"
import { Card, HStack, Icon, Separator, Text, VStack } from "@chakra-ui/react"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"
import { LuCircleSlash2 } from "react-icons/lu"

const compactFormatter = getCompactFormatter(2)

export const ProposalVoteComment = ({ vote }: { vote: ProposalComment }) => {
  const { t } = useTranslation()

  const voteLabel = {
    FOR: { icon: UilThumbsUp, label: t("Approved"), color: "success.primary" },
    ABSTAIN: { icon: LuCircleSlash2, label: t("Abstain"), color: "warning.primary" },
    AGAINST: { icon: UilThumbsDown, label: t("Against"), color: "error.primary" },
  }

  const voteType = vote.support

  const votePower = ethers.formatEther(BigInt(vote.power || 0))

  return (
    <Card.Root key={vote.voter} variant="baseWithBorder" p={"32px"} borderRadius={"16px"}>
      <VStack alignItems="stretch" gap={4}>
        <HStack justify={"space-between"} align={"top"}>
          <HStack fontSize={"lg"} fontWeight={"semibold"}>
            <Icon as={voteLabel[voteType].icon} color={voteLabel[voteType].color} />
            <Text color={voteLabel[voteType].color}>{voteLabel[voteType].label}</Text>
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

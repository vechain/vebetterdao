import { ProposalState, useProposalVotesIndexer } from "@/api"
import { timestampToTimeLeft } from "@/utils"
import { Heading, Icon, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { ProposalVotesProgressBar } from "./components/ProposalVotesProgressBar"
import { ProposalVotesResults } from "./components/ProposalVotesResults"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { ExclamationTriangle, ResponsiveCard } from "@/components"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

type Props = {
  proposalId: string
}

const forColor = "#3DBA67"
const againstColor = "#C84968"
const abstainColor = "#B59525"

export const ProposalOverviewVotes = ({ proposalId }: Props) => {
  const { t } = useTranslation()

  const { data: proposalVotes, isLoading: proposalVotesLoading } = useProposalVotesIndexer({ proposalId })

  const { proposal } = useProposalDetail()
  const proposalState = proposal.state
  const [_, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const votes = {
    for: {
      color: forColor,
      text: t("Votes for"),
      percentage: proposalVotes?.votes.for.percentagePower ?? 0,
      voters: proposalVotes?.votes.for.voters ?? 0,
      icon: <Icon as={UilThumbsUp} boxSize={["20px", "20px", "16px"]} />,
    },
    against: {
      color: againstColor,
      text: t("Against"),
      percentage: proposalVotes?.votes.against.percentagePower ?? 0,
      voters: proposalVotes?.votes.against.voters ?? 0,
      icon: <Icon as={UilThumbsDown} boxSize={["20px", "20px", "16px"]} />,
    },

    abstain: {
      color: abstainColor,
      text: t("Abstained"),
      percentage: proposalVotes?.votes.abstain.percentagePower ?? 0,
      voters: proposalVotes?.votes.abstain.voters ?? 0,
      icon: <Image src={"/assets/icons/abstained.svg"} alt="abstained" boxSize={["20px", "20px", "16px"]} />,
    },
  }

  switch (proposalState) {
    case ProposalState.DepositNotMet:
      return (
        <ResponsiveCard cardProps={{ variant: "filled", w: "full", flex: 1 }}>
          <VStack>
            <ExclamationTriangle color="#757575" />
            <Text fontWeight={"500"} textAlign={"center"} fontSize="20px">
              {t("The community has not supported this proposal and was canceled")}
            </Text>
          </VStack>
        </ResponsiveCard>
      )

    case ProposalState.Pending:
      if (proposal.isDepositReached) {
        return (
          <ResponsiveCard cardProps={{ variant: "filled", w: "full", flex: 1 }}>
            <VStack>
              <Image w="88px" h="88px" color="#004CFC" src="/assets/icons/vote.svg" alt="vote-icon" />
              <Text fontWeight={"500"} textAlign={"center"} fontSize="20px">
                {t("This proposal will be voted in")}
              </Text>
              <Text textAlign={"center"} fontSize="36px">
                {timestampToTimeLeft(proposal.votingStartDate)}
              </Text>
            </VStack>
          </ResponsiveCard>
        )
      }
      return (
        <ResponsiveCard cardProps={{ variant: "filled", w: "full", flex: 1 }}>
          <VStack>
            <ExclamationTriangle />
            <Text fontWeight={"500"} textAlign={"center"} fontSize="20px">
              {t("This proposal must get the support of the community before the round starts")}
            </Text>
            <Text textAlign={"center"} fontSize="36px">
              {timestampToTimeLeft(proposal.votingStartDate)}
            </Text>
          </VStack>
        </ResponsiveCard>
      )

    case ProposalState.Active:
    case ProposalState.Succeeded:
    case ProposalState.Canceled:
    case ProposalState.Defeated:
    case ProposalState.Queued:
    case ProposalState.Executed:
      const borderColorMap = {
        [ProposalState.Active]: undefined,
        [ProposalState.Canceled]: "#D23F63",
        [ProposalState.Defeated]: "#D23F63",
        [ProposalState.Succeeded]: "#38BF66",
        [ProposalState.Queued]: "#38BF66",
        [ProposalState.Executed]: "#38BF66",
      }
      return (
        <ResponsiveCard
          cardProps={{
            variant: "filled",
            w: "full",
            flex: 1,
            borderColor: borderColorMap[proposalState],
            borderWidth: 1,
          }}>
          <VStack alignItems={"stretch"} w="full" justify={"space-between"} gap={3}>
            <Heading size="xl">{t("Real time votes")}</Heading>
            <VStack w="full" justify={"space-between"} gap={0} align={"flex-start"}>
              <Text fontWeight={"400"} color="#6A6A6A">
                {t("Wallets voted")}
              </Text>
              <Skeleton loading={proposalVotesLoading}>
                <Heading size="md">{getCompactFormatter(2).format(proposalVotes?.totalVoters ?? 0)}</Heading>
              </Skeleton>
            </VStack>
            <VStack alignItems={"stretch"} gap={6}>
              {Object.entries(votes).map(([key, value]) => (
                <ProposalVotesProgressBar
                  isLoading={proposalVotesLoading}
                  key={key}
                  text={value.text}
                  percentage={value.percentage}
                  voters={value.voters}
                  color={value.color}
                  icon={value.icon}
                />
              ))}
            </VStack>
            <ProposalVotesResults proposalId={proposalId} proposalState={proposalState} />
          </VStack>
        </ResponsiveCard>
      )
  }
}

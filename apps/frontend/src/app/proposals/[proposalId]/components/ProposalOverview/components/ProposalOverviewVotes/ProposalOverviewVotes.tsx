import { ProposalState, useProposalVotes } from "@/api"
import { timestampToTimeLeft } from "@/utils"
import { Card, Heading, Icon, Image, Skeleton, Text, VStack, Stat } from "@chakra-ui/react"
import { ProposalVotesProgressBar } from "./components/ProposalVotesProgressBar"
import { ProposalVotesResults } from "./components/ProposalVotesResults"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { ExclamationTriangle, ResponsiveCard } from "@/components"
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

  const { data: proposalVotes, isLoading: proposalVotesLoading } = useProposalVotes(proposalId)

  const { proposal } = useProposalDetail()
  const proposalState = proposal.state

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
        <ResponsiveCard cardProps={{ variant: "primary", w: "full", flex: 1 }}>
          <VStack>
            <ExclamationTriangle color="#757575" />
            <Text fontWeight={"500"} textAlign={"center"} textStyle="xl">
              {t("The community has not supported this proposal and was canceled")}
            </Text>
          </VStack>
        </ResponsiveCard>
      )

    case ProposalState.Pending:
      if (proposal.isDepositReached) {
        return (
          <ResponsiveCard cardProps={{ variant: "primary", w: "full", flex: 1 }}>
            <VStack>
              <Image w="88px" h="88px" color="#004CFC" src="/assets/icons/vote.svg" alt="vote-icon" />
              <Text fontWeight={"500"} textAlign={"center"} textStyle="xl">
                {t("This proposal will be voted in")}
              </Text>
              <Text textAlign={"center"} textStyle="4xl">
                {timestampToTimeLeft(proposal.votingStartDate)}
              </Text>
            </VStack>
          </ResponsiveCard>
        )
      }
      return (
        <ResponsiveCard cardProps={{ variant: "primary", w: "full", flex: 1 }}>
          <VStack>
            <ExclamationTriangle />
            <Text fontWeight={"500"} textAlign={"center"} textStyle="xl">
              {t("This proposal must get the support of the community before the round starts")}
            </Text>
            <Text textAlign={"center"} textStyle="4xl">
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
      return (
        <Card.Root variant="primary" w="full" p="4" flex={1} border="sm" borderColor="border.tertiary">
          <Card.Body asChild>
            <VStack alignItems={"stretch"} w="full" gap="4">
              <Heading size="md">{t("Real time votes")}</Heading>
              <Stat.Root flex={0}>
                <Stat.Label>{t("Wallets voted")}</Stat.Label>
                <Stat.ValueText>
                  <Skeleton loading={proposalVotesLoading}>
                    {getCompactFormatter(2).format(proposalVotes?.totalVoters ?? 0)}
                  </Skeleton>
                </Stat.ValueText>
              </Stat.Root>
              <VStack alignItems={"stretch"} gap="4">
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
          </Card.Body>
        </Card.Root>
      )
  }
}

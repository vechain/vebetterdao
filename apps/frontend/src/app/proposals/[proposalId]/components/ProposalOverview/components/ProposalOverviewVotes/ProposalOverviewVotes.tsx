import { ProposalState, useProposalState, useProposalVotes } from "@/api"
import { timestampToTimeLeft } from "@/utils"
import { Box, Image, Text, VStack } from "@chakra-ui/react"
import { ProposalVotesProgressBar } from "./components/ProposalVotesProgressBar"
import { ProposalVotesResults } from "./components/ProposalVotesResults"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { ExclamationTriangle, ResponsiveCard } from "@/components"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"

type Props = {
  proposalId: string
}
export const ProposalOverviewVotes = ({ proposalId }: Props) => {
  const { t } = useTranslation()

  const { data: proposalVotes, isLoading: proposalVotesLoading } = useProposalVotes(proposalId)
  const { data: proposalState } = useProposalState(proposalId)

  const { proposal } = useProposalDetail()
  const [_, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  switch (proposalState) {
    case ProposalState.DepositNotMet:
      return (
        <ResponsiveCard cardProps={{ variant: "filled", w: "full", flex: 1 }}>
          <VStack>
            <ExclamationTriangle color="#757575" />
            <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
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
              <Image w="88px" h="88px" color="#004CFC" src="/images/vote.svg" alt="vote-icon" />
              <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
                {t("This proposal will be voted in")}
              </Text>
              <Text color="#252525" fontWeight={"700"} textAlign={"center"} fontSize="36px">
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
            <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
              {t("This proposal must get the support of the community before the round starts")}
            </Text>
            <Text color="#252525" fontWeight={"700"} textAlign={"center"} fontSize="36px">
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
          <VStack alignItems={"stretch"} w="full" justify={"space-between"}>
            <Text color="#000000" fontWeight={"700"} fontSize="20px">
              {t("Real time votes")}
            </Text>
            <VStack alignItems={"stretch"} gap={6}>
              <ProposalVotesProgressBar
                isLoading={proposalVotesLoading}
                text={t("Votes for")}
                percentage={proposalVotes?.forPercentage ?? 0}
                color="#38BF66"
                icon={<UilThumbsUp size="16px" color="#38BF66" />}
              />
              <ProposalVotesProgressBar
                isLoading={proposalVotesLoading}
                text={t("Against")}
                percentage={proposalVotes?.againstPercentage ?? 0}
                color="#D23F63"
                icon={<UilThumbsDown size="16px" color="#D23F63" />}
              />
              <ProposalVotesProgressBar
                isLoading={proposalVotesLoading}
                text={t("Abstained")}
                percentage={proposalVotes?.abstainPercentage ?? 0}
                color="#B59525"
                icon={<Image src={"/images/abstained.svg"} alt="abstained" />}
              />
            </VStack>
            <Box mt={2}>
              <ProposalVotesResults proposalId={proposalId} />
            </Box>
          </VStack>
        </ResponsiveCard>
      )
  }
}

import { ProposalState, useCurrentProposal } from "@/api"
import { HStack, Text } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const ProposalVotesResults = () => {
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()

  switch (proposal.state) {
    case ProposalState.Defeated:
      if (!proposal.isQuorumReached)
        return (
          <Text fontSize="14px" color="#D23F63" fontWeight={600}>
            {t("Quorum was not reached")}
          </Text>
        )
      return (
        <Text fontSize="14px" color="#D23F63" fontWeight={600}>
          {t("Proposal rejected by voting")}
        </Text>
      )
    case ProposalState.Succeeded:
    case ProposalState.Queued:
    case ProposalState.Executed:
      return (
        <Text fontSize="14px" color="#38BF66" fontWeight={600}>
          {t("Proposal approved by voting")}
        </Text>
      )
    case ProposalState.Canceled:
      return (
        <HStack gap={1}>
          <Text fontSize="14px">{t("The proposal is being")}</Text>
          <Text fontSize="14px" color="#D23F63">
            {t("canceled")}
          </Text>
        </HStack>
      )
    case ProposalState.Active:
      if (!proposal.isQuorumReached)
        return (
          <HStack>
            <UilExclamationCircle />
            <Text fontSize="14px" color="#6A6A6A">
              {t("Quorum not reached yet")}
            </Text>
          </HStack>
        )
  }
}

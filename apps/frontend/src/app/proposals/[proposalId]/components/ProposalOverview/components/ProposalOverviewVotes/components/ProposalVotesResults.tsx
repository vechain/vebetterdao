import { ProposalState, useIsProposalQuorumReached } from "@/api"
import { HStack, Skeleton, Text } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

type Props = {
  proposalId: string
  proposalState: ProposalState
}
export const ProposalVotesResults = ({ proposalId, proposalState }: Props) => {
  const { t } = useTranslation()
  const { data: isQuorumReached, isLoading: isQuorumReachedLoading } = useIsProposalQuorumReached(proposalId, true)

  switch (proposalState) {
    case ProposalState.Defeated:
      if (!isQuorumReached)
        return (
          <Skeleton isLoaded={!isQuorumReachedLoading}>
            <Text fontSize="14px" color="#D23F63" fontWeight={600}>
              {t("Quorum was not reached")}
            </Text>
          </Skeleton>
        )
      return (
        <Skeleton isLoaded={!isQuorumReachedLoading}>
          <Text fontSize="14px" color="#D23F63" fontWeight={600}>
            {t("Proposal rejected by voting")}
          </Text>
        </Skeleton>
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
          <Text fontSize="14px">{t("The proposal was")}</Text>
          <Text fontSize="14px" color="#D23F63">
            {t("canceled")}
          </Text>
        </HStack>
      )
    case ProposalState.Active:
      return (
        <Skeleton isLoaded={!isQuorumReachedLoading}>
          <HStack>
            <UilExclamationCircle />
            <Text fontSize="14px" color="#6A6A6A" fontWeight={isQuorumReached ? 600 : 400}>
              {isQuorumReached ? t("Quorum reached") : t("Quorum not reached yet")}
            </Text>
          </HStack>
        </Skeleton>
      )
    default:
      return (
        <Skeleton>
          <Text fontSize="14px" color="#38BF66" fontWeight={600}>
            {t("Proposal approved by voting")}
          </Text>
        </Skeleton>
      )
  }
}

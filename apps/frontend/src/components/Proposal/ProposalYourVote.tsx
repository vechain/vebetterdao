import { Box, HStack, Icon, Image, Skeleton, Text, TextProps, Em } from "@chakra-ui/react"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ProposalState } from "@/hooks/proposals/grants/types"

import { useGovernorVotesOnBlock } from "../../api/contracts/governance/hooks/useGovernorVotesOnBlock"
import { useProposalSnapshot } from "../../api/contracts/governance/hooks/useProposalSnapshot"
import { useUserSingleProposalVoteEvent } from "../../api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { useVotingThreshold } from "../../api/contracts/governance/hooks/useVotingThreshold"

const forColor = "#3DBA67"
const againstColor = "#C84968"
const abstainColor = "#B59525"
const SupportMapping = {
  0: {
    label: "Against",
    color: againstColor,
    icon: <Icon as={UilThumbsDown} color={againstColor} boxSize={["20px", "20px", "16px"]} />,
  },
  1: {
    label: "For",
    color: forColor,
    icon: <Icon as={UilThumbsUp} color={forColor} boxSize={["20px", "20px", "16px"]} />,
  },
  2: {
    label: "Abstain",
    color: abstainColor,
    icon: (
      <Image
        src={"/assets/icons/abstained.svg"}
        alt="abstained"
        color={abstainColor}
        boxSize={["20px", "20px", "16px"]}
      />
    ),
  },
}
type Props = {
  proposalId: string
  renderTitle?: boolean
  textProps?: TextProps
  proposalState?: ProposalState
}
export const ProposalYourVote = ({ proposalId, renderTitle = true, textProps = {}, proposalState }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data: userVote } = useUserSingleProposalVoteEvent(proposalId)

  const isFinished = useMemo(() => {
    return [ProposalState.Defeated, ProposalState.Executed, ProposalState.Queued, ProposalState.Succeeded].includes(
      proposalState as ProposalState,
    )
  }, [proposalState])

  const yourVoteLabel = useMemo(() => {
    if (!account?.address) return null
    if (!userVote)
      return (
        <Text textStyle="xs" {...textProps}>
          {t("You haven't voted")}
        </Text>
      )

    const support = SupportMapping[Number(userVote.support) as keyof typeof SupportMapping]

    //if for some reason we are not able to map the support
    if (!support)
      return (
        <Text textStyle="xs" {...textProps}>
          {t("You have voted")}
        </Text>
      )

    return (
      <HStack gap={1}>
        <Text textStyle={["sm", "sm", "xs"]} {...textProps}>
          {t("You voted")}
        </Text>
        <Em>
          <Text textStyle={["sm", "sm", "xs"]} {...textProps}>
            {t(support.label as any)}
          </Text>
        </Em>
      </HStack>
    )
  }, [userVote, account?.address, textProps, t])

  const shouldRender = useMemo(() => {
    return (
      account?.address &&
      [
        ProposalState.Active,
        ProposalState.Defeated,
        ProposalState.Executed,
        ProposalState.Queued,
        ProposalState.Succeeded,
      ].includes(proposalState as ProposalState)
    )
  }, [proposalState, account?.address])

  if (!shouldRender) return null

  if (!userVote)
    return (
      <Box>
        {renderTitle && <Text textStyle={["lg", "lg", "md"]}>{t("Your vote")}</Text>}
        {isFinished ? (
          <Text textStyle={["lg", "lg", "md"]} {...textProps}>
            {t("You have not voted")}
          </Text>
        ) : (
          <NoVoteAndActiveCheckVotingPower proposalId={proposalId} textProps={textProps} />
        )}
      </Box>
    )

  return (
    <Box>
      {renderTitle && (
        <Text textStyle={["lg", "lg", "md"]} {...textProps}>
          {t("Your vote")}
        </Text>
      )}
      {yourVoteLabel}
    </Box>
  )
}

const NoVoteAndActiveCheckVotingPower = ({
  proposalId,
  textProps = {},
}: {
  proposalId: string
  textProps?: TextProps
}) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: snapshotBlock, isLoading: snapshotBlockloading } = useProposalSnapshot(proposalId)
  const { data: userSnapshot, isLoading: userSnapshotLoading } = useGovernorVotesOnBlock(
    snapshotBlock ? Number(snapshotBlock) : undefined,
    account?.address ?? undefined,
  )
  const { data: threshold } = useVotingThreshold()

  const snapshotLoading = snapshotBlockloading || userSnapshotLoading

  const hasVotesAtSnapshot = useMemo(() => {
    return Number(userSnapshot ?? 0) >= Number(threshold ?? 0)
  }, [userSnapshot, threshold])

  return (
    <Skeleton loading={snapshotLoading}>
      <Text textStyle={["lg", "lg", "md"]} {...textProps}>
        {hasVotesAtSnapshot ? t("You have not voted") : t("No votes to cast")}
      </Text>
    </Skeleton>
  )
}

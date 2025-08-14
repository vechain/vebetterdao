import { useGetVotesOnBlock, useProposalSnapshot, useUserSingleProposalVoteEvent, useVotingThreshold } from "@/api"
import { Box, HStack, Icon, Image, Skeleton, Text, TextProps } from "@chakra-ui/react"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { MdHowToVote } from "react-icons/md"
import { useWallet } from "@vechain/vechain-kit"
import { ProposalState } from "@/hooks/proposals/grants/types"

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
        <Text fontSize={12} color={"#6A6A6A"} fontWeight={400} {...textProps}>
          {t("You haven't voted")}
        </Text>
      )

    const support = SupportMapping[Number(userVote.support) as keyof typeof SupportMapping]

    //if for some reason we are not able to map the support
    if (!support)
      return (
        <Text fontSize={12} color={"#6A6A6A"} fontWeight={400} {...textProps}>
          {t("You have voted")}
        </Text>
      )

    return (
      <HStack spacing={1}>
        {support.icon}

        <Text fontSize={["lg", "lg", "md"]} fontWeight={600} {...textProps}>
          {t("You voted")}
        </Text>
        <Text fontSize={["lg", "lg", "md"]} fontWeight={600} {...textProps}>
          {t(support.label as any)}
        </Text>
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
        {renderTitle && (
          <Text color="#6A6A6A" fontSize={["lg", "lg", "md"]} fontWeight={400}>
            {t("Your vote")}
          </Text>
        )}
        {isFinished ? (
          <Text fontSize={["lg", "lg", "md"]} fontWeight={400} {...textProps}>
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
        <Text fontSize={["lg", "lg", "md"]} fontWeight={400} {...textProps}>
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
  const { data: userSnapshot, isLoading: userSnapshotLoading } = useGetVotesOnBlock(
    snapshotBlock ? Number(snapshotBlock) : undefined,
    account?.address ?? undefined,
  )
  const { data: threshold } = useVotingThreshold()

  const snapshotLoading = snapshotBlockloading || userSnapshotLoading

  const hasVotesAtSnapshot = useMemo(() => {
    return Number(userSnapshot ?? 0) >= Number(threshold ?? 0)
  }, [userSnapshot, threshold])

  return (
    <Skeleton isLoaded={!snapshotLoading}>
      <HStack spacing={2}>
        <Icon as={MdHowToVote} boxSize={4} color={"contrast-fg-on-muted"} />

        <Text fontSize={["lg", "lg", "md"]} fontWeight={400} {...textProps}>
          {hasVotesAtSnapshot ? t("You have not voted") : t("No votes to cast")}
        </Text>
      </HStack>
    </Skeleton>
  )
}

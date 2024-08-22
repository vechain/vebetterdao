import {
  ProposalState,
  useGetVotesOnBlock,
  useProposalSnapshot,
  useProposalState,
  useUserSingleProposalVoteEvent,
} from "@/api"
import { Box, HStack, Icon, Image, Skeleton, Text, TextProps } from "@chakra-ui/react"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { MdHowToVote } from "react-icons/md"
import { useWallet } from "@vechain/dapp-kit-react"

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
      <Image src={"/images/abstained.svg"} alt="abstained" color={abstainColor} boxSize={["20px", "20px", "16px"]} />
    ),
  },
}

type Props = {
  proposalId: string
  renderTitle?: boolean
  textProps?: TextProps
}
export const ProposalYourVote = ({ proposalId, renderTitle = true, textProps = {} }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data: userVote } = useUserSingleProposalVoteEvent(proposalId)
  const { data: proposalState } = useProposalState(proposalId)

  const isFinished = useMemo(() => {
    return [ProposalState.Defeated, ProposalState.Executed, ProposalState.Queued, ProposalState.Succeeded].includes(
      proposalState as ProposalState,
    )
  }, [proposalState])

  const yourVoteLabel = useMemo(() => {
    if (!account) return null
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
  }, [userVote])

  const shouldRender = useMemo(() => {
    return (
      account &&
      [
        ProposalState.Active,
        ProposalState.Defeated,
        ProposalState.Executed,
        ProposalState.Queued,
        ProposalState.Succeeded,
      ].includes(proposalState as ProposalState)
    )
  }, [proposalState, account])

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
          <Text fontSize={["lg", "lg", "md"]} color={"#252525"} fontWeight={400} {...textProps}>
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
        <Text color="#6A6A6A" fontSize={["lg", "lg", "md"]} fontWeight={400} {...textProps}>
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
    account ?? undefined,
  )

  const snapshotLoading = snapshotBlockloading || userSnapshotLoading

  const hasVotesAtSnapshot = useMemo(() => {
    return Number(userSnapshot ?? 0) > 0
  }, [userSnapshot])

  return (
    <Skeleton isLoaded={!snapshotLoading}>
      <HStack spacing={2}>
        <Icon as={MdHowToVote} boxSize={4} color={"#252525"} />

        <Text fontSize={["lg", "lg", "md"]} color={"#252525"} fontWeight={400} {...textProps}>
          {hasVotesAtSnapshot ? t("You have not voted") : t("No votes to cast")}
        </Text>
      </HStack>
    </Skeleton>
  )
}

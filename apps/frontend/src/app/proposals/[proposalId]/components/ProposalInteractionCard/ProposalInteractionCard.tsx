import {
  useGetProposalDeposits,
  useGetVotesOnBlock,
  useHasVotedInProposals,
  useIsDepositReached,
  useProposalDepositThreshold,
  useProposalSnapshot,
  useProposalUserDeposit,
} from "@/api"
import { CountdownBoxes } from "@/components"
import { useGetVot3Balance, useProposalVot3Deposit } from "@/hooks"
import { ProposalEnriched, ProposalState } from "@/hooks/proposals/grants/types"
import { Box, Button, Card, Heading, HStack, Icon, Progress, Separator, Text } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { BigNumber } from "bignumber.js"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaHeart, FaRegHeart } from "react-icons/fa"
import { FiBarChart2 } from "react-icons/fi"
import { TbClockHour8 } from "react-icons/tb"

type Props = {
  proposal: ProposalEnriched
  isVotingPhase: boolean
  daysLeft: number
  hoursLeft: number
  minutesLeft: number
}

export const ProposalInteractionCard = ({ proposal, isVotingPhase, daysLeft, hoursLeft, minutesLeft }: Props) => {
  const { t } = useTranslation()
  const { sendTransaction } = useProposalVot3Deposit({ proposalId: proposal.id })
  const { account } = useWallet()
  const isDepositReached = useIsDepositReached(proposal.id)
  const { data: userHasAlreadyVotedInProposal } = useHasVotedInProposals([proposal.id])
  const { data: userVot3BalanceQueryData } = useGetVot3Balance(account?.address)
  const { data: proposalDepositThresholdQueryData } = useProposalDepositThreshold(proposal.id)
  const { data: currentDepositAmountQueryData } = useGetProposalDeposits(proposal.id)
  const { data: roundSnapshot } = useProposalSnapshot(proposal.id)
  const { data: userVot3OnSnapshot } = useGetVotesOnBlock(Number(roundSnapshot ?? 0), account?.address ?? "")
  const { data: userDeposits } = useProposalUserDeposit(proposal.id, account?.address ?? "")

  const currentDepositAmount = BigInt(currentDepositAmountQueryData ?? 0)
  const proposalDepositThreshold = BigInt(proposalDepositThresholdQueryData ?? 0)

  const percentageSupported = useMemo(() => {
    if (currentDepositAmount === BigInt(0)) return 0
    if (proposalDepositThreshold === BigInt(0)) return 0
    return BigNumber(currentDepositAmount).div(proposalDepositThreshold).times(100).toNumber().toFixed(0)
  }, [currentDepositAmount, proposalDepositThreshold])

  const userVotingPower = Number(userVot3OnSnapshot ?? 0)

  const hasUserAlreadyVoted = userHasAlreadyVotedInProposal?.[proposal.id] ?? false

  const userVot3Balance = Number(userVot3BalanceQueryData?.original ?? 0)

  const proposalDepositReached = isDepositReached.data

  const isActionButtonDisabled = useMemo(() => {
    //If proposal is canceled , always disable action button
    if (proposal.state === ProposalState.Canceled) {
      return true
    }

    //If it's voting phase AND:
    //- User has voted
    //- User cannot vote
    if (isVotingPhase) {
      return hasUserAlreadyVoted || userVotingPower === 0
    }

    //If it's support phase AND:
    //- User has no more balance
    //- Maximum support reached
    if (!isVotingPhase) {
      return userVot3Balance < 1 || proposalDepositReached
    }

    return false
  }, [proposal.state, isVotingPhase, hasUserAlreadyVoted, userVotingPower, userVot3Balance, proposalDepositReached])

  const supportWith100Vot3 = useCallback(() => {
    sendTransaction({ amount: ethers.parseEther("3000").toString(), proposalId: proposal.id })
  }, [sendTransaction, proposal.id])

  return (
    <Card.Root variant="baseWithBorder">
      <Card.Header as={HStack}>
        <Icon as={TbClockHour8} boxSize={5} />
        <Card.Title>
          <Heading>{t("Ends in")}</Heading>
        </Card.Title>
      </Card.Header>
      <Card.Body gap={4}>
        <CountdownBoxes days={daysLeft} hours={hoursLeft} minutes={minutesLeft} />
        <Separator />
        <HStack justify="space-between">
          <HStack>
            <Icon as={FiBarChart2} boxSize={5} />
            <Heading>{t("Results")}</Heading>
          </HStack>
          <Button variant="primaryGhost">{t("Details")}</Button>
        </HStack>
        <Progress.Root key="results" value={Number(percentageSupported ?? 0)}>
          {" "}
          {/* TODO: Make it compatible with voting phase results as well */}
          <Progress.Track borderRadius="full" height="8px">
            <Progress.Range borderRadius="full" bg="success.primary" />
          </Progress.Track>
        </Progress.Root>
        {isVotingPhase ? (
          <HStack color="success.primary">
            <Icon as={FaRegHeart} boxSize={5} />
            <Text>{`${percentageSupported}%`}</Text>
          </HStack>
        ) : (
          <HStack color="success.primary">
            <Icon as={FaRegHeart} boxSize={5} />
            <Text>{`${percentageSupported}%`}</Text>
          </HStack>
        )}

        {userDeposits ? (
          <HStack>
            <Text color="gray.600">{t("You supported with")}</Text>
            <Box border="2px solid" borderColor="success.primary" color="success.primary" borderRadius={"lg"}>
              <HStack gap={2} px={"12px"} py={"8px"}>
                <Icon as={FaHeart} boxSize={5} color="success.primary" />
                <Text>{t("{{votingPower}} VOT3", { votingPower: ethers.formatEther(userDeposits) })}</Text>
              </HStack>
            </Box>
          </HStack>
        ) : null}
        <Button variant="primaryAction" onClick={supportWith100Vot3} disabled={isActionButtonDisabled}>
          {isVotingPhase ? t("Vote") : t("Support")}
        </Button>
      </Card.Body>
    </Card.Root>
  )
}

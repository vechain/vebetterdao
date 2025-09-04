import {
  useGetVotesOnBlock,
  useProposalDepositThreshold,
  useProposalSnapshot,
  useProposalUserDeposit,
} from "@/api/contracts/governance/hooks"
import { useGetProposalDeposits } from "@/api/contracts/governance/hooks/useGetProposalDeposits"
import { useHasVotedInProposals } from "@/api/contracts/governance/hooks/useHasVotedInProposals"
import { useIsDepositReached } from "@/api/contracts/governance/hooks/useIsDepositReached"
import { useProposalInteractionDates } from "@/api/contracts/governance/hooks/useProposalInteractionDates"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { CountdownBoxes } from "@/components"
import { useBreakpoints, useGetVot3Balance, useProposalEnriched, useProposalVot3Deposit } from "@/hooks"
import { ProposalEnriched, ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import {
  Box,
  Button,
  Card,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Progress,
  Separator,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { BigNumber } from "bignumber.js"
import dayjs from "dayjs"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaHeart, FaRegHeart } from "react-icons/fa"
import { FiBarChart2 } from "react-icons/fi"
import { TbClockHour8 } from "react-icons/tb"

import { ProposalOverview } from "./ProposalOverview"

// import { ProposalTimeline } from "./ProposalTimeline"

type Props = {
  proposalId: string
}

const ProposalInteractionCard = ({ proposal }: { proposal: ProposalEnriched }) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { supportEndDate, votingEndDate } = useProposalInteractionDates(proposal)
  const isDepositReached = useIsDepositReached(proposal.id)
  const { data: userHasAlreadyVotedInProposal } = useHasVotedInProposals([proposal.id])
  const { data: userVot3BalanceQueryData } = useGetVot3Balance(account?.address)
  const { data: proposalDepositThresholdQueryData } = useProposalDepositThreshold(proposal.id)
  const { data: currentDepositAmountQueryData } = useGetProposalDeposits(proposal.id)
  const { data: roundSnapshot } = useProposalSnapshot(proposal.id)
  const { data: userVot3OnSnapshot } = useGetVotesOnBlock(Number(roundSnapshot ?? 0), account?.address ?? "")
  const { data: userDeposits } = useProposalUserDeposit(proposal.id, account?.address ?? "")

  const { sendTransaction } = useProposalVot3Deposit({ proposalId: proposal.id })

  const isVotingPhase = proposal.state === ProposalState.Active
  const targetDate = isVotingPhase ? votingEndDate : supportEndDate

  const { daysLeft, hoursLeft, minutesLeft } = useMemo(() => {
    const now = dayjs()
    const daysLeft = dayjs(targetDate).diff(now, "days")
    const hoursLeft = dayjs(targetDate).diff(now, "hours") % 24
    const minutesLeft = dayjs(targetDate).diff(now, "minutes") % 60
    return {
      daysLeft,
      hoursLeft,
      minutesLeft,
    }
  }, [targetDate])

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

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: { proposals } = { proposals: [] }, isLoading } = useProposalEnriched()
  const { isMobile } = useBreakpoints()

  const proposal = useMemo(() => {
    return proposals.find(p => p.id === proposalId)
  }, [proposals, proposalId])

  const isGrant = useMemo(() => {
    return proposal?.type === ProposalType.Grant
  }, [proposal])

  //TODO: Ensure we have a proposal
  if (!proposal) return null

  const BreadcrumItems = [
    {
      label: "Proposals", //TODO: This should be dynamic based on the proposal type like "Grants" or "Proposals"
      href: "/proposals",
    },
    {
      label: "Overview",
      href: `/proposals/${proposalId}`,
    },
  ]

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <PageBreadcrumb items={BreadcrumItems} />

      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]} order={[2, 2, 1]}>
          <ProposalOverview isGrant={isGrant} proposal={proposal} isLoading={isLoading} />
        </GridItem>
        <GridItem colSpan={[3, 3, 1]} order={[1, 1, 2]}>
          <VStack align="stretch" gap={8}>
            {isMobile ? (
              <Tabs.Root defaultValue="session" w="full" colorPalette="blue" fitted>
                <Tabs.List>
                  <Tabs.Trigger
                    value="session"
                    color="text"
                    fontWeight="400"
                    _selected={{
                      color: "#004CFC",
                      fontWeight: "800",
                    }}>
                    {"Session"}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="timeline"
                    color="text.subtle"
                    fontWeight="600"
                    _selected={{
                      color: "#004CFC",
                      fontWeight: "800",
                    }}>
                    {"Timeline"}
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="session" pt={6}>
                  <ProposalInteractionCard proposal={proposal} />
                </Tabs.Content>
                <Tabs.Content value="timeline" pt={6}>
                  <Text>{"Timeline"}</Text>
                  {/* <ProposalTimeline proposal={proposal} /> */}
                </Tabs.Content>
              </Tabs.Root>
            ) : (
              <>
                <ProposalInteractionCard proposal={proposal} />
                <Text>{"Timeline"}</Text>

                {/* <Session Information component/> */}
                {/* <ProposalTimeline proposal={proposal} /> */}
              </>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  )
}

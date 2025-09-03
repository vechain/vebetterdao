import {
  Grid,
  GridItem,
  VStack,
  Card,
  Icon,
  HStack,
  Separator,
  Heading,
  Button,
  Progress,
  Text,
  Box,
} from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { useMemo } from "react"
import { ProposalType, ProposalEnriched } from "@/hooks/proposals/grants/types"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { useTranslation } from "react-i18next"
import { useProposalEnriched } from "@/hooks"
import { CountdownBoxes } from "@/components"
import { TbClockHour8 } from "react-icons/tb"
import { FiBarChart2 } from "react-icons/fi"
import { FaRegHeart, FaHeart } from "react-icons/fa"
import { useProposalInteractionDates } from "@/api/contracts/governance/hooks/useProposalInteractionDates"
import dayjs from "dayjs"
type Props = {
  proposalId: string
}

const ProposalInteractionCard = ({ proposal }: { proposal: ProposalEnriched }) => {
  const { t } = useTranslation()

  const { supportEndDate, votingEndDate } = useProposalInteractionDates(proposal)
  const daysLeftToSupport = dayjs(supportEndDate).diff(dayjs(), "days")
  const hoursLeftToSupport = dayjs(supportEndDate).diff(dayjs(), "hours") % 24
  const minutesLeftToSupport = dayjs(supportEndDate).diff(dayjs(), "minutes") % 60

  const daysLeftToVoting = dayjs(votingEndDate).diff(dayjs(), "days")
  const hoursLeftToVoting = dayjs(votingEndDate).diff(dayjs(), "hours") % 24
  const minutesLeftToVoting = dayjs(votingEndDate).diff(dayjs(), "minutes") % 60

  const isVotingPhase = dayjs().isAfter(dayjs(supportEndDate))
  const daysLeft = isVotingPhase ? daysLeftToVoting : daysLeftToSupport
  const hoursLeft = isVotingPhase ? hoursLeftToVoting : hoursLeftToSupport
  const minutesLeft = isVotingPhase ? minutesLeftToVoting : minutesLeftToSupport
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
        <Progress.Root key="results" value={100}>
          <Progress.Track borderRadius="full" height="8px">
            <Progress.Range borderRadius="full" bg="success.primary" />
          </Progress.Track>
        </Progress.Root>
        <HStack color="success.primary">
          <Icon as={FaRegHeart} boxSize={5} />
          <Text>{t("100%")}</Text>
        </HStack>
        <HStack>
          <Text color="gray.600">{t("You supported with")}</Text>
          <Box border="2px solid" borderColor="success.primary" color="success.primary" borderRadius={"lg"}>
            <HStack gap={2} px={"12px"} py={"8px"}>
              <Icon as={FaHeart} boxSize={5} color="success.primary" />
              <Text>{t("{{votingPower}} VOT3", { votingPower: 1.56 })}</Text>
            </HStack>
          </Box>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: { proposals } = { proposals: [] }, isLoading } = useProposalEnriched()

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
        <GridItem colSpan={[3, 3, 2]}>
          <ProposalOverview isGrant={isGrant} proposal={proposal} isLoading={isLoading} />
        </GridItem>
        <GridItem colSpan={[3, 3, 1]}>
          <ProposalInteractionCard proposal={proposal} />
        </GridItem>
      </Grid>
    </VStack>
  )
}

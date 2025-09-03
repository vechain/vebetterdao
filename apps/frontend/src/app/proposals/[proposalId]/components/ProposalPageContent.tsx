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
import { ProposalType } from "@/hooks/proposals/grants/types"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { useTranslation } from "react-i18next"
import { useProposalEnriched } from "@/hooks"
import { CountdownBoxes } from "@/components"
import { TbClockHour8 } from "react-icons/tb"
import { FiBarChart2 } from "react-icons/fi"
import { FaRegHeart, FaHeart } from "react-icons/fa"
type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { t } = useTranslation()
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
          <Card.Root variant="baseWithBorder">
            <Card.Header as={HStack}>
              <Icon as={TbClockHour8} boxSize={5} />
              <Card.Title>
                <Heading>{t("Ends in")}</Heading>
              </Card.Title>
            </Card.Header>
            <Card.Body gap={4}>
              <CountdownBoxes days={1} hours={1} minutes={2} />
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
        </GridItem>
      </Grid>
    </VStack>
  )
}

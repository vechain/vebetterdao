import { useProposalsEvents, useActiveProposals, useIncomingProposals, usePastProposals, useCurrentBlock } from "@/api"
import { ProposalCard, ProposalInfoCard } from "@/components"
import {
  VStack,
  HStack,
  Icon,
  Heading,
  Tabs,
  TabList,
  Tab,
  TabIndicator,
  TabPanels,
  TabPanel,
  Grid,
  Box,
  Text,
  Skeleton,
  Spinner,
  Button,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaPlus, FaScroll } from "react-icons/fa6"

export enum PROPOSAL_TYPE {
  ACTIVE,
  PAST,
  INCOMING,
}
export const ProposalsPageContent = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { data: proposalsEvents, error: proposalsEventsError, isLoading: proposalsEventsLoading } = useProposalsEvents()
  const { data: activeProposals, error: activeProposalsError, isLoading: activeProposalsLoading } = useActiveProposals()
  const {
    data: incomingProposals,
    error: incomingProposalsError,
    isLoading: incomingProposalsLoading,
  } = useIncomingProposals()
  const { data: pastProposals, error: pastProposalsError, isLoading: pastProposalsLoading } = usePastProposals()

  const { data: currentBlock } = useCurrentBlock()

  const renderActiveProposalsTab = useMemo(() => {
    if (activeProposalsLoading) {
      return (
        <VStack w="full" spacing={8} alignItems={"center"} mt={16}>
          <Spinner size={"lg"} />
        </VStack>
      )
    }
    if (activeProposalsError) {
      return (
        <Box>
          <Heading textAlign={"center"} mt={16} color={"red"}>
            {t("Error loading active proposals")}
          </Heading>
          <Text textAlign={"center"}>{activeProposalsError.message}</Text>
        </Box>
      )
    }
    if (!activeProposals?.length) {
      return (
        <Box>
          <Heading textAlign={"center"} mt={16}>
            {t("No active proposals")}
          </Heading>
          <Text textAlign={"center"}>{t("Create a proposal to get started")}</Text>
        </Box>
      )
    }
    return (
      <Grid w="full">
        {activeProposals?.map(proposal => (
          <ProposalInfoCard type={PROPOSAL_TYPE.ACTIVE} proposal={proposal} key={proposal.proposalId} />
        ))}
      </Grid>
    )
  }, [activeProposals, activeProposalsError, activeProposalsLoading, t])

  const renderIncomingProposalsTab = useMemo(() => {
    if (incomingProposalsLoading) {
      return (
        <VStack w="full" spacing={8} alignItems={"center"} mt={16} justify="center">
          <Spinner size={"lg"} />
        </VStack>
      )
    }
    if (incomingProposalsError) {
      return (
        <Box>
          <Heading textAlign={"center"} mt={16} color={"red"}>
            {t("Error loading incoming proposals")}
          </Heading>
          <Text textAlign={"center"}>{incomingProposalsError.message}</Text>
        </Box>
      )
    }
    if (!incomingProposals?.length) {
      return (
        <Box>
          <Heading textAlign={"center"} mt={16}>
            {t("No incoming proposals")}
          </Heading>
          <Text textAlign={"center"}>{t("Incoming proposals are proposals that are not yet active")}</Text>
        </Box>
      )
    }
    return (
      <Grid w="full">
        {incomingProposals?.map(proposal => (
          <ProposalInfoCard type={PROPOSAL_TYPE.INCOMING} proposal={proposal} key={proposal.proposalId} />
        ))}
      </Grid>
    )
  }, [incomingProposals, incomingProposalsError, incomingProposalsLoading, t])

  const onNewCLick = useCallback(() => {
    router.push("/proposals/new")
  }, [router])

  const renderPastProposalsTab = useMemo(() => {
    if (pastProposalsLoading) {
      return (
        <VStack w="full" spacing={8} alignItems={"center"} mt={16} justify="center">
          <Spinner size={"lg"} />
        </VStack>
      )
    }
    if (pastProposalsError) {
      return (
        <Box>
          <Heading textAlign={"center"} mt={16} color={"red"}>
            {t("Error loading past proposals")}
          </Heading>
          <Text textAlign={"center"}>{pastProposalsError.message}</Text>
        </Box>
      )
    }
    if (!pastProposals?.length) {
      return (
        <Box>
          <Heading textAlign={"center"} mt={16}>
            {t("No past proposals")}
          </Heading>
          <Text textAlign={"center"}>{t("Past proposals are proposals that have been completed")}</Text>
        </Box>
      )
    }
    return (
      <Grid w="full">
        {pastProposals?.map(proposal => (
          <ProposalInfoCard type={PROPOSAL_TYPE.PAST} proposal={proposal} key={proposal.proposalId} />
        ))}
      </Grid>
    )
  }, [pastProposals, pastProposalsError, pastProposalsLoading, t])

  return (
    <VStack w="full" spacing={8} alignItems={"flex-start"} justify="center" data-testid="proposals">
      <HStack spacing={4} w="full" justify={"space-between"} alignItems={"center"}>
        <Box>
          <HStack spacing={3} alignItems={"center"}>
            <Icon as={FaScroll} fontSize={"3xl"} />
            <Heading as="h1" size="xl">
              {t("Proposals")}
            </Heading>
          </HStack>
          <Skeleton isLoaded={!proposalsEventsLoading}>
            <Text fontSize="md">
              {t("{{proposals}} proposals created from the beginning", {
                proposals: proposalsEvents?.created.length,
              })}
            </Text>
          </Skeleton>
        </Box>
        <Box>
          <Button onClick={onNewCLick} leftIcon={<FaPlus />}>
            {t("Create proposal")}
          </Button>
          <Text fontSize="md" textAlign={"center"}>
            {t("Current block:")} <b>{currentBlock?.number}</b>
          </Text>
        </Box>
      </HStack>
      <Tabs position="relative" variant="unstyled" w="full">
        <TabList>
          <Tab>{t("Active ({{proposals}})", { proposals: activeProposals?.length ?? 0 })}</Tab>
          <Tab isDisabled={incomingProposals?.length === 0}>
            {t("Incoming ({{proposals}})", { proposals: incomingProposals?.length ?? 0 })}
          </Tab>
          <Tab isDisabled={pastProposals?.length === 0}>
            {t("Past ({{proposals}})", { proposals: pastProposals?.length ?? 0 })}
          </Tab>
        </TabList>
        <TabIndicator mt="-1.5px" height="2px" bg="blue.500" borderRadius="1px" />
        <TabPanels>
          <TabPanel px={0}>{renderActiveProposalsTab}</TabPanel>
          <TabPanel px={0}>{renderIncomingProposalsTab}</TabPanel>
          <TabPanel px={0}>{renderPastProposalsTab}</TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  )
}

import { useProposalsEvents, useActiveProposals, useIncomingProposals, usePastProposals, useCurrentBlock } from "@/api"
import { CreateProposalButton, ProposalCard } from "@/components"
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
} from "@chakra-ui/react"
import { useMemo } from "react"
import { FaScroll } from "react-icons/fa6"

export const ProposalsPageContent = () => {
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
            Error loading active proposals
          </Heading>
          <Text textAlign={"center"}>{activeProposalsError.message}</Text>
        </Box>
      )
    }
    if (!activeProposals?.length) {
      return (
        <Box>
          <Heading textAlign={"center"} mt={16}>
            No active proposals
          </Heading>
          <Text textAlign={"center"}>Create a proposal to get started</Text>
        </Box>
      )
    }
    return (
      <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
        {activeProposals?.map(proposal => <ProposalCard proposal={proposal} key={proposal.proposalId} />)}
      </Grid>
    )
  }, [activeProposals, activeProposalsError, activeProposalsLoading])

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
            Error loading incoming proposals
          </Heading>
          <Text textAlign={"center"}>{incomingProposalsError.message}</Text>
        </Box>
      )
    }
    if (!incomingProposals?.length) {
      return (
        <Box>
          <Heading textAlign={"center"} mt={16}>
            No incoming proposals
          </Heading>
          <Text textAlign={"center"}>Incoming proposals are proposals that are not yet active</Text>
        </Box>
      )
    }
    return (
      <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
        {incomingProposals?.map(proposal => <ProposalCard proposal={proposal} key={proposal.proposalId} />)}
      </Grid>
    )
  }, [incomingProposals, incomingProposalsError, incomingProposalsLoading])

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
            Error loading past proposals
          </Heading>
          <Text textAlign={"center"}>{pastProposalsError.message}</Text>
        </Box>
      )
    }
    if (!pastProposals?.length) {
      return (
        <Box>
          <Heading textAlign={"center"} mt={16}>
            No past proposals
          </Heading>
          <Text textAlign={"center"}>Past proposals are proposals that have been completed</Text>
        </Box>
      )
    }
    return (
      <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
        {pastProposals?.map(proposal => <ProposalCard proposal={proposal} key={proposal.proposalId} />)}
      </Grid>
    )
  }, [pastProposals, pastProposalsError, pastProposalsLoading])

  return (
    <VStack w="full" spacing={8} alignItems={"flex-start"} justify="center" data-testid="proposals">
      <HStack spacing={4} w="full" justify={"space-between"} alignItems={"center"}>
        <Box>
          <HStack spacing={3} alignItems={"center"}>
            <Icon as={FaScroll} fontSize={"3xl"} />
            <Heading as="h1" size="xl">
              Proposals
            </Heading>
          </HStack>
          <Skeleton isLoaded={!proposalsEventsLoading}>
            <Text fontSize="md">{proposalsEvents?.created.length} proposals created from the beginning</Text>
          </Skeleton>
        </Box>
        <Box>
          <CreateProposalButton />
          <Text fontSize="md" textAlign={"center"}>
            Current block: <b>{currentBlock?.number}</b>
          </Text>
        </Box>
      </HStack>
      <Tabs position="relative" variant="unstyled" w="full">
        <TabList>
          <Tab>Active ({activeProposals?.length ?? 0})</Tab>
          <Tab isDisabled={incomingProposals?.length === 0}>Incoming ({incomingProposals?.length ?? 0})</Tab>
          <Tab isDisabled={pastProposals?.length === 0}>Past ({pastProposals?.length ?? 0})</Tab>
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

"use client"

import { useActiveProposals, useCurrentBlock, useIncomingProposals, usePastProposals, useProposalsEvents } from "@/api"
import { CreateProposalButton, ProposalCard } from "@/components"
import {
  Box,
  Grid,
  HStack,
  Heading,
  Icon,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useEffect } from "react"
import { FaScroll } from "react-icons/fa"

export default function ProposalsPage() {
  const { data: proposalsEvents } = useProposalsEvents()
  const { data: activeProposals } = useActiveProposals()
  const { data: incomingProposals } = useIncomingProposals()
  const { data: pastProposals } = usePastProposals()

  useEffect(() => {
    console.log({ proposalsEvents })
  }, [proposalsEvents])

  const { data: currentBlock } = useCurrentBlock()

  return (
    <VStack w="full" spacing={8} alignItems={"flex-start"}>
      <HStack spacing={4} w="full" justify={"space-between"} alignItems={"center"}>
        <Box>
          <HStack spacing={3} alignItems={"center"}>
            <Icon as={FaScroll} fontSize={"3xl"} />
            <Heading as="h1" size="xl">
              Proposals
            </Heading>
          </HStack>
          <Text fontSize="md">{proposalsEvents?.created.length} proposals created from the beginning</Text>
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
          <Tab>Active ({activeProposals?.length})</Tab>
          <Tab isDisabled={incomingProposals?.length === 0}>Incoming ({incomingProposals?.length})</Tab>
          <Tab isDisabled={pastProposals?.length === 0}>Past ({pastProposals?.length})</Tab>
        </TabList>
        <TabIndicator mt="-1.5px" height="2px" bg="blue.500" borderRadius="1px" />
        <TabPanels>
          <TabPanel px={0}>
            {!activeProposals?.length ? (
              <Box>
                <Heading textAlign={"center"} mt={16}>
                  No active proposals
                </Heading>
                <Text textAlign={"center"}>Create a proposal to get started</Text>
              </Box>
            ) : (
              <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
                {activeProposals?.map(proposal => <ProposalCard proposal={proposal} key={proposal.proposalId} />)}
              </Grid>
            )}
          </TabPanel>
          <TabPanel px={0}>
            {!incomingProposals?.length ? (
              <Box>
                <Heading textAlign={"center"} mt={16}>
                  No incoming proposals
                </Heading>
                <Text textAlign={"center"}>Incoming proposals are proposals that are not yet active</Text>
              </Box>
            ) : (
              <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
                {incomingProposals?.map(proposal => <ProposalCard proposal={proposal} key={proposal.proposalId} />)}
              </Grid>
            )}
          </TabPanel>

          <TabPanel px={0}>
            {!pastProposals?.length ? (
              <Box>
                <Heading textAlign={"center"} mt={16}>
                  No past proposals
                </Heading>
                <Text textAlign={"center"}>Past proposals are proposals that have been completed</Text>
              </Box>
            ) : (
              <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
                {pastProposals?.map(proposal => <ProposalCard proposal={proposal} key={proposal.proposalId} />)}
              </Grid>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  )
}

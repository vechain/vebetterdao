"use client"

import { useActiveProposals, useIncomingProposals, usePastProposals, useProposalsEvents } from "@/api"
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
import { useConnex } from "@vechain/dapp-kit-react"
import { useEffect } from "react"
import { FaScroll } from "react-icons/fa"

export default function ProposalsPage() {
  const { data: proposalsEvents } = useProposalsEvents()
  const { data: activeProposals } = useActiveProposals()
  const { data: incomingProposals } = useIncomingProposals()
  const { data: pastProposals } = usePastProposals()

  const { thor } = useConnex()

  useEffect(() => {
    console.log("Latest block:", thor.status.head.number)
  }, [thor])

  useEffect(() => {
    console.log({ proposalsEvents })
  }, [proposalsEvents])

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
        <CreateProposalButton />
      </HStack>
      <Tabs position="relative" variant="unstyled" w="full">
        <TabList>
          <Tab>Active ({activeProposals?.length})</Tab>
          <Tab isDisabled={incomingProposals?.length === 0}>Incoming ({incomingProposals?.length})</Tab>
          <Tab isDisabled={pastProposals?.length === 0}>Past ({pastProposals?.length})</Tab>
        </TabList>
        <TabIndicator mt="-1.5px" height="2px" bg="blue.500" borderRadius="1px" />
        <TabPanels>
          <TabPanel>
            <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6}>
              {activeProposals?.map(proposal => <ProposalCard proposal={proposal} key={proposal.proposalId} />)}
            </Grid>
          </TabPanel>
          <TabPanel>
            <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6}>
              {incomingProposals?.map(proposal => <ProposalCard proposal={proposal} key={proposal.proposalId} />)}
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6}>
              {pastProposals?.map(proposal => <ProposalCard proposal={proposal} key={proposal.proposalId} />)}
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  )
}

import { ProposalCreatedEvent, ProposalState, useProposalState } from "@/api"
import { Box, Card, CardBody, CardFooter, CardHeader, Code, HStack, Heading, Tag, Text, VStack } from "@chakra-ui/react"
import { AddressButton } from "./AddressButton"
import { useMemo } from "react"
import { governanceAvailableContracts } from "@/constants"
import { abi } from "thor-devkit"
import { AddressUtils } from "@repo/utils"
import { humanAddress } from "@repo/utils/FormattingUtils"

type Props = {
  proposal: ProposalCreatedEvent
}
export const ProposalCard: React.FC<Props> = ({ proposal }) => {
  const { data: state } = useProposalState(proposal.proposalId)

  const decodedCallDatas = useMemo(() => {
    const decoded = []
    for (const [index, contractAddress] of proposal.targets.entries()) {
      console.log("Decoding call data for contract", contractAddress)
      const contract = governanceAvailableContracts.find(c => AddressUtils.compareAddresses(c.address, contractAddress))
      if (!contract) continue

      //try to decode the call data till we find a match
      for (const method of contract.abi.abi) {
        if (method.type !== "function") continue
        try {
          const decodedCallData = abi.decodeParameters(method.inputs, proposal.callDatas[index] as string)

          decoded.push({
            contract: { ...contract, address: contractAddress },
            method: method,
            params: decodedCallData,
          })
          break
        } catch (e) {}
      }
    }
    return decoded
  }, [proposal])

  console.log({ decodedCallDatas })
  return (
    <Card flex={1}>
      <CardHeader>
        <VStack spacing={4} w="full" align="flex-start">
          <HStack w="full" justify="space-between">
            <Tag colorScheme="blue">Governance</Tag>
            <Tag colorScheme="green">{!!state && ProposalState[state]}</Tag>
          </HStack>
          <Heading as="h3" size="md">
            {proposal.description}
          </Heading>
        </VStack>
      </CardHeader>
      <CardBody>
        <Card variant={"outline"}>
          <CardBody>
            {decodedCallDatas.map((target, index) => (
              <VStack spacing={2} w="full" align="flex-start" key={`${index} - ${target.contract.address}`}>
                <HStack w="full" justify={"space-between"}>
                  <Text>Contract</Text>
                  <Code>
                    {humanAddress(target.contract.address, 6, 4)} ({target.contract.abi.contractName})
                  </Code>
                </HStack>
                <HStack w="full" justify={"space-between"}>
                  <Text>Method</Text>
                  <Code>
                    {target.method.name}({target.method.inputs?.map(i => `${i.type} ${i.name}`)})
                  </Code>
                </HStack>
              </VStack>
            ))}
          </CardBody>
        </Card>
        <Box>
          <Text>Proposer</Text>
          <AddressButton address={proposal.proposer} buttonSize="xs" addressFontSize="xs" />
        </Box>
      </CardBody>
      <CardFooter>
        <HStack justify={"space-between"} w="full">
          <Box>
            <Text>Ends at block</Text>
            <Heading as="h4" size="sm">
              {proposal.voteEnd}
            </Heading>
          </Box>
        </HStack>
      </CardFooter>
    </Card>
  )
}

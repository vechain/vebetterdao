import { ProposalCreatedEvent, ProposalState, useProposalState } from "@/api"
import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Code,
  HStack,
  Heading,
  Spacer,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react"
import { AddressButton } from "./AddressButton"
import { useMemo } from "react"
import { governanceAvailableContracts } from "@/constants"
import { abi } from "thor-devkit"
import { AddressUtils, ContractUtils } from "@repo/utils"
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

      const calldata = proposal.callDatas[index] as string

      try {
        // The first 10 characters of the call data is the function to call, all the rest is the eventual encoded parameters
        //TODO: use correct type of ABI
        //@ts-ignore
        const decodedMethod = ContractUtils.resolveAbiFunctionFromCalldata(calldata, contract.abi)
        let _decodedCallData

        if (decodedMethod) {
          console.log({
            decodedMethod,
            calldata,
          })
          _decodedCallData = abi.decodeParameters(decodedMethod.inputs, calldata)
        }
        decoded.push({
          contract: { ...contract, address: contractAddress },
          method: decodedMethod,
          params: _decodedCallData,
        })
      } catch (e) {}
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
                  {target.method ? (
                    <Code>
                      {target.method.name}({target.method.inputs.map(i => `${i.type} ${i.name}`).join(", ")})
                    </Code>
                  ) : (
                    <Code>Unknown</Code>
                  )}
                </HStack>
                {target.method?.inputs.length && (
                  <HStack w="full" justify={"space-between"}>
                    <Text>Params</Text>
                    <VStack align="flex-start">
                      {target.method.inputs.map((input, i) => (
                        <HStack key={i} w="full" justify={"space-between"}>
                          <Code>{target.params?.[input.name]}</Code>
                        </HStack>
                      ))}
                    </VStack>
                  </HStack>
                )}
              </VStack>
            ))}
          </CardBody>
        </Card>
        <Spacer h={4} />
        <HStack justify={"space-between"}>
          <Heading size="sm"> Proposer</Heading>
          <AddressButton address={proposal.proposer} buttonSize="sm" addressFontSize="sm" />
        </HStack>
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

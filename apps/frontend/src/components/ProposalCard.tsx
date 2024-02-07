import { ProposalCreatedEvent, ProposalState, useCurrentBlock, useProposalState } from "@/api"
import { Box, Card, CardBody, CardFooter, CardHeader, Code, HStack, Heading, Tag, Text, VStack } from "@chakra-ui/react"
import { AddressButton } from "./AddressButton"
import { useMemo } from "react"
import { governanceAvailableContracts } from "@/constants"
import { abi } from "thor-devkit"
import { AddressUtils, ContractUtils } from "@repo/utils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { getConfig } from "@repo/config"
import dayjs from "dayjs"
import { ethers } from "ethers"
import { ProposalVotesProgressBar } from "./ProposalVotesProgressBar"
import { CastVoteButton } from "./CastVoteButton"

const config = getConfig()
const blockTime = config.network.blockTime
type Props = {
  proposal: ProposalCreatedEvent
}
export const ProposalCard: React.FC<Props> = ({ proposal }) => {
  const { data: state } = useProposalState(proposal.proposalId)
  const { data: currentBlock } = useCurrentBlock()

  const decodedCallDatas = useMemo(() => {
    const decoded = []
    for (const [index, contractAddress] of proposal.targets.entries()) {
      //   console.log("Decoding call data for contract", contractAddress)
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
          _decodedCallData = abi.decodeParameters(decodedMethod.inputs, `0x${calldata.slice(10)}`)
        }
        decoded.push({
          contract: { ...contract, address: contractAddress },
          method: decodedMethod,
          params: _decodedCallData,
        })
      } catch (e) {
        console.error("Error decoding call data", e)
      }
    }
    return decoded
  }, [proposal])

  const isStarted = useMemo(() => {
    const startBlock = Number(proposal.voteStart)
    if (!startBlock || !currentBlock) return null
    const startBlockFromNow = startBlock - currentBlock.number
    return startBlockFromNow <= 0
  }, [proposal])

  const isEnded = useMemo(() => {
    const endBlock = Number(proposal.voteEnd)
    if (!endBlock || !currentBlock) return null
    const endBlockFromNow = endBlock - currentBlock.number
    return endBlockFromNow <= 0
  }, [proposal])

  const estimatedEndTime = useMemo(() => {
    const endBlock = Number(proposal.voteEnd)
    if (!endBlock || !currentBlock) return null
    const endBlockFromNow = endBlock - currentBlock.number
    //not ended yet
    if (endBlockFromNow > 0) {
      const durationLeftTimestamp = endBlockFromNow * blockTime
      const endDate = dayjs().add(durationLeftTimestamp, "milliseconds")
      return endDate.fromNow()
    } else {
      const durationLeftTimestamp = -endBlockFromNow * blockTime
      const endDate = dayjs().subtract(durationLeftTimestamp, "milliseconds")
      return endDate.fromNow()
    }
  }, [proposal])

  const estimatedStartTime = useMemo(() => {
    if (!proposal.voteStart) return null
    const startBlock = Number(proposal.voteStart)
    if (!startBlock || !currentBlock) return null
    const startBlockFromNow = startBlock - currentBlock.number
    //not started yet
    if (startBlockFromNow > 0) {
      const durationLeftTimestamp = startBlockFromNow * blockTime
      const startDate = dayjs().add(durationLeftTimestamp, "milliseconds")
      return startDate.fromNow()
    } else return "Started"
  }, [proposal])

  const renderInputParameterValue = (input: abi.Function.Parameter, value: string) => {
    if (input.type === "address")
      return (
        <Code>
          <AddressButton address={value} buttonSize="sm" addressFontSize="sm" variant="ghost" showAddressIcon={false} />
        </Code>
      )
    if (input.type === "bytes32") return <Code>{ethers.decodeBytes32String(value)}</Code>

    return <Code>{value}</Code>
  }

  return (
    <Card flex={1}>
      <CardHeader>
        <VStack spacing={4} w="full" align="flex-start">
          <HStack w="full" justify="space-between">
            <Tag colorScheme="blue">Governance</Tag>
            <Tag colorScheme="green">{state !== undefined && ProposalState[state]}</Tag>
          </HStack>
          <HStack justify={"space-between"} w="full">
            <Heading size="sm"> Proposer</Heading>
            <AddressButton address={proposal.proposer} buttonSize="xs" addressFontSize="xs" />
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
                          {renderInputParameterValue(input, target.params?.[input.name])}
                        </HStack>
                      ))}
                    </VStack>
                  </HStack>
                )}
              </VStack>
            ))}
          </CardBody>
        </Card>
      </CardBody>
      <CardFooter>
        <VStack spacing={4} align={"flex-start"} w="full">
          <ProposalVotesProgressBar proposal={proposal} />
          <HStack justify={"space-between"} w="full">
            {isStarted ? (
              <Box>
                <Heading as="h4" size="sm" color="orange">
                  {isEnded ? "Ended" : "Ends"} {estimatedEndTime}
                </Heading>
                <Text fontWeight={"normal"} fontSize={"sm"}>
                  At block #{proposal.voteEnd}
                </Text>
              </Box>
            ) : (
              <Box>
                <Heading as="h4" size="sm" color="orange">
                  {"Starts"} {estimatedStartTime}
                </Heading>
                <Text fontWeight={"normal"} fontSize={"sm"}>
                  At block #{proposal.voteStart}
                </Text>
              </Box>
            )}
            <CastVoteButton proposal={proposal} />
          </HStack>
        </VStack>
      </CardFooter>
    </Card>
  )
}

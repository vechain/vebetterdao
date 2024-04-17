import {
  ProposalCreatedEvent,
  ProposalState,
  useCurrentBlock,
  useProposalDeadline,
  useProposalSnapshot,
  useProposalState,
} from "@/api"
import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Code,
  HStack,
  Heading,
  Skeleton,
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
  const { data: proposalSnapshotBlock, isLoading: proposalSnapshotBlockLoading } = useProposalSnapshot(
    proposal.proposalId,
  )
  const { data: proposalDeadlineBlock, isLoading: proposalDeadlineBlockLoading } = useProposalDeadline(
    proposal.proposalId,
  )

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
    const startBlock = Number(proposalSnapshotBlock)
    if (!startBlock || !currentBlock) return null
    const startBlockFromNow = startBlock - currentBlock.number
    return startBlockFromNow <= 0
  }, [proposal])

  const isEnded = useMemo(() => {
    const endBlock = Number(proposalDeadlineBlock)
    if (!endBlock || !currentBlock) return null
    const endBlockFromNow = endBlock - currentBlock.number
    return endBlockFromNow <= 0
  }, [proposal])

  const estimatedEndTime = useMemo(() => {
    const endBlock = Number(proposalDeadlineBlock)
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
  }, [proposalSnapshotBlock, proposalDeadlineBlock, currentBlock])

  const estimatedStartTime = useMemo(() => {
    if (!proposalSnapshotBlock) return null
    const startBlock = Number(proposalSnapshotBlock)
    if (!startBlock || !currentBlock) return null
    const startBlockFromNow = startBlock - currentBlock.number
    //not started yet
    if (startBlockFromNow > 0) {
      const durationLeftTimestamp = startBlockFromNow * blockTime
      const startDate = dayjs().add(durationLeftTimestamp, "milliseconds")
      return startDate.fromNow()
    } else return "Started"
  }, [proposalSnapshotBlock, currentBlock])

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

  const proposalStateTagColor = useMemo(() => {
    switch (state) {
      case 7:
        return "green"
      case 6:
        return "red"
      case 5:
        return "blue"
      case 4:
        return "green"
      case 3:
        return "red"
      case 2:
        return "red"
      case 1:
        return "green"
      case 0:
        return "orange"
      default:
        return "gray"
    }
  }, [state])

  return (
    <Card flex={1}>
      <CardHeader>
        <VStack spacing={4} w="full" align="flex-start">
          <HStack w="full" justify="space-between">
            <Tag colorScheme="blue">Governance</Tag>
            <Tag colorScheme={proposalStateTagColor}>{state !== undefined ? ProposalState[state] : "N/A"}</Tag>
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
        <VStack spacing={8} w="full" align="center">
          <Card w="full">
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
          <ProposalVotesProgressBar proposal={proposal} />
        </VStack>
      </CardBody>
      <CardFooter>
        <VStack spacing={4} align={"flex-start"} w="full">
          <HStack justify={"space-between"} w="full">
            {isStarted ? (
              <Box>
                <Skeleton isLoaded={!!estimatedEndTime}>
                  <Heading as="h4" size="sm" color="orange">
                    {isEnded ? "Ended" : "Ends"} {estimatedEndTime}
                  </Heading>
                </Skeleton>
                <Skeleton isLoaded={!proposalDeadlineBlockLoading}>
                  <Text fontWeight={"normal"} fontSize={"sm"}>
                    At block #{proposalDeadlineBlock}
                  </Text>
                </Skeleton>
              </Box>
            ) : (
              <Box>
                <Skeleton isLoaded={!!estimatedStartTime}>
                  <Heading as="h4" size="sm" color="orange">
                    {"Starts"} in round #{proposal.roundIdVoteStart}
                  </Heading>
                </Skeleton>
              </Box>
            )}
            <CastVoteButton proposal={proposal} />
          </HStack>
        </VStack>
      </CardFooter>
    </Card>
  )
}

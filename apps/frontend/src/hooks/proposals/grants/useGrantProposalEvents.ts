import { useEvents } from "@/hooks"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory, Treasury__factory } from "@repo/contracts"
import { formatEther } from "ethers"
import BigNumber from "bignumber.js"

const b3trGovernorAddress = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const treasuryInterface = Treasury__factory.createInterface()

const getAndDecodeGrantAmount = (calldata?: `0x${string}`) => {
  if (!calldata) return BigNumber(0)
  const decodedData = treasuryInterface.decodeFunctionData("transferB3TR", calldata)
  const formattedAmount = formatEther(decodedData?.[1]?.toString() ?? "0")
  return BigNumber(formattedAmount)
}

export const useGrantProposalEvents = () => {
  const events = useEvents({
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalCreated",
    filterParams: { type: 1 },
    abi,
    mapResponse: response => {
      const grantAmount = getAndDecodeGrantAmount(response.decodedData.args.calldatas[0])
      return {
        id: response.decodedData.args.proposalId.toString(),
        ipfsDescription: response.decodedData.args.description,
        votingRoundId: response.decodedData.args.roundIdVoteStart.toString(),
        depositThreshold: response.decodedData.args.depositThreshold.toString(),
        proposerAddress: response.decodedData.args.proposer,
        calldatas: response.decodedData.args.calldatas,
        targets: response.decodedData.args.targets,
        createdAt: response.meta.blockTimestamp,
        createdAtBlock: response.meta.blockNumber,
        grantAmount,
      }
    },
  })
  console.log({ events: events.data })

  return events
}

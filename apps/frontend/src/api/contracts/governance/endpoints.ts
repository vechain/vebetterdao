import { getEvents } from "@/api/blockchain"
import { config } from "@repo/config"
import Contract from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
import { abi, address } from "thor-devkit"
const contractAbi = Contract.abi

const GOVERNANCE_CONTRACT = config.governorContractAddress

export const getProposalsEvents = async (thor: Connex.Thor) => {
  const proposalCreatedAbi = contractAbi.find(abi => abi.name === "ProposalCreated")
  if (!proposalCreatedAbi) throw new Error("ProposalCreated event not found")
  const proposalCreatedEvent = new abi.Event(proposalCreatedAbi as abi.Event.Definition)

  const proposalCanceledAbi = contractAbi.find(abi => abi.name === "ProposalCanceled")
  if (!proposalCanceledAbi) throw new Error("ProposalCanceled event not found")
  const proposalCanceledEvent = new abi.Event(proposalCanceledAbi as abi.Event.Definition)

  const filterCriteria = [
    {
      address: GOVERNANCE_CONTRACT,
      topic0: proposalCreatedEvent.signature,
    },
    {
      address: GOVERNANCE_CONTRACT,
      topic0: proposalCanceledEvent.signature,
    },
  ]

  //TODO: decode the events
  const events = await getEvents({ thor, filterCriteria })
  console.log({ events })
}

/**
 * Build the clause to create a proposal with the given parameters
 * @param thor the thor client
 * @param contractsAbi the contracts to execute the proposal on
 * @param targets the contract addresses targets of the proposal calls
 * @param values the values to pass as parameters to the proposal calls
 * @param functionsAbiNames the names of the functions to call on the contracts
 * @param description the description of the proposal
 * @returns the clause to create the proposal
 */
export const buildCreateProposalTx = (
  thor: Connex.Thor,
  contractsAbi: (typeof Contract.abi)[],
  targets: string[],
  values: number[][],
  functionsAbiNames: string[],
  description: string,
): Connex.Vendor.TxMessage[0] => {
  // all the arrays must have the same length as there is a 1 to 1 mapping between the elements
  const arrays = [contractsAbi, targets, values, functionsAbiNames]
  const lengths = arrays.map(array => array.length)
  const firstLength = lengths[0]
  if (lengths.some(length => length !== firstLength))
    throw new Error("contractsAbi, targets, values and functionsAbiNames must have the same length")

  const callData: string[] = []
  // build the callData for each contractAbi
  for (const [index, contractAbi] of contractsAbi.entries()) {
    const abiName = functionsAbiNames[index] as string
    const target = targets[index] as string
    const functionCallValues = values[index] as number[]
    const functionAbi = contractAbi.find(e => e.name === abiName)
    if (!functionAbi) throw new Error(`Function abi not found for ${abiName}`)
    const functionAbiInstance = new abi.Function(functionAbi as abi.Function.Definition)
    const encodedCallData = functionAbiInstance.encode(functionCallValues)
    callData.push(encodedCallData)
  }

  // build the clause to create the proposal with the given parameters
  const proposalAbi = contractAbi.find(abi => abi.name === "propose")
  if (!proposalAbi) throw new Error("Proposal abi not found")
  const proposalAbiInstance = new abi.Function(proposalAbi as abi.Function.Definition)
  //   const encodedProposalData = proposalAbiInstance.encode([contractsAbi, targets, values, callData, description])

  //TODO: Is values correct here ? The entire function was built considering that values are the parameters of the functions to call
  // and not the values to send to the propose method
  const clause = thor.account(GOVERNANCE_CONTRACT).method(proposalAbi).asClause(targets, values, callData, description)

  return {
    ...clause,
    comment: `Create proposal to ${targets} with values ${values} and callData ${callData}`,
    abi: proposalAbi,
  }
}

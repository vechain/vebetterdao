import { getConfig } from "@repo/config"
import { abi } from "thor-devkit"
import { AvailableContractAbis, EnhancedClause } from "@/hooks"
import { B3TRGovernor__factory, VOT3__factory } from "@repo/contracts/typechain-types/factories/contracts"
import { ethers } from "ethers"

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress
const b3trGovernorInterface = B3TRGovernor__factory.createInterface()

const VOT3_CONTRACT = getConfig().vot3ContractAddress
const vot3Interface = VOT3__factory.createInterface()

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
  contractsAbi: AvailableContractAbis[],
  targets: string[],
  values: (string | number)[][],
  description: string,
  startRoundId: number | string,
): EnhancedClause[] => {
  // all the arrays must have the same length as there is a 1 to 1 mapping between the elements
  const arrays = [contractsAbi, targets, values]
  const lengths = arrays.map(array => array.length)
  const firstLength = lengths[0]
  if (lengths.some(length => length !== firstLength))
    throw new Error("contractsAbi, targets, values must have the same length")

  const callData: string[] = []
  // build the callData for each contractAbi
  for (const [index, contractAbi] of contractsAbi.entries()) {
    const functionCallValues = values[index] as (string | number)[]
    const functionAbiInstance = new abi.Function(contractAbi as abi.Function.Definition)
    const encodedCallData = functionAbiInstance.encode(...functionCallValues)
    callData.push(encodedCallData)
  }

  const depositAmount = ethers.parseEther("0").toString()

  const approveClause: EnhancedClause = {
    to: getConfig().vot3ContractAddress,
    value: depositAmount,
    data: vot3Interface.encodeFunctionData("approve", [GOVERNANCE_CONTRACT, depositAmount]),
    comment: `Approve ${GOVERNANCE_CONTRACT} to transfer ${depositAmount} VOT3`,
    abi: JSON.parse(JSON.stringify(vot3Interface.getFunction("approve"))),
  }

  const clause: EnhancedClause = {
    to: GOVERNANCE_CONTRACT,
    value: 0,
    data: b3trGovernorInterface.encodeFunctionData("propose", [
      targets,
      [0],
      callData,
      description,
      startRoundId,
      depositAmount,
    ]),
    comment: `Create new proposal for round ${startRoundId} with description: ${description}`,
    abi: JSON.parse(JSON.stringify(b3trGovernorInterface.getFunction("propose"))),
  }

  return [approveClause, clause]
}

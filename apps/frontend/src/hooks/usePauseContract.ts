import { EnhancedClause, currentBlockQueryKey } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"
import { getConfig } from "@repo/config"
import { GalaxyMember__factory, B3TR__factory, VOT3__factory, B3TRGovernor__factory } from "@repo/contracts"
import {
  getIsGMPausedQueryKey,
  getIsB3trPausedQueryKey,
  getIsVot3PausedQueryKey,
  getIsB3TRGovernorPausedQueryKey,
} from "@/api"
import { useBuildTransaction } from "./useBuildTransaction"

type Props = {
  contract: string
  contractName: string
  onSuccess?: () => void
}

const B3TRInterface = B3TR__factory.createInterface()

const VOT3Interface = VOT3__factory.createInterface()

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()

const B3TRGovernorInterface = B3TRGovernor__factory.createInterface()

/**
 * getInterface is a function that returns the contract interface based on the contract address.
 * @param contract - The contract address
 * @returns The contract interface based on the contract address
 */
const getInterface = (contract: string) => {
  switch (contract) {
    case getConfig().b3trContractAddress:
      return B3TRInterface
    case getConfig().vot3ContractAddress:
      return VOT3Interface
    case getConfig().galaxyMemberContractAddress:
      return GalaxyMemberInterface
    case getConfig().b3trGovernorAddress:
      return B3TRGovernorInterface
    default:
      throw new Error("Invalid contract address")
  }
}

/**
 * getQueryToInvalidate is a function that returns the query key to invalidate based on the contract address.
 * @param contract - The contract address
 * @returns The query key to invalidate based on the contract address
 */
const getQueryToInvalidate = (contract: string) => {
  switch (contract) {
    case getConfig().b3trContractAddress:
      return getIsB3trPausedQueryKey()
    case getConfig().vot3ContractAddress:
      return getIsVot3PausedQueryKey()
    case getConfig().galaxyMemberContractAddress:
      return getIsGMPausedQueryKey()
    case getConfig().b3trGovernorAddress:
      return getIsB3TRGovernorPausedQueryKey()
    default:
      return []
  }
}

/**
 * usePauseContract is a custom hook that pauses and unpauses a contract.
 * It uses the useSendTransaction hook to send the transaction and the useQueryClient hook to invalidate the queries after the transaction.
 */
export const usePauseContract = ({ contract, contractName, onSuccess }: Props) => {
  const contractInterface = useMemo(() => getInterface(contract), [contract])

  const buildPauseClause = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: contract,
        value: 0,
        data: contractInterface.encodeFunctionData("pause"),
        comment: `Pause contract: ${contractName}`,
        abi: JSON.parse(JSON.stringify(contractInterface.getFunction("pause"))),
      },
    ]

    return clauses
  }, [contract, contractInterface, contractName])

  const buildUnpauseClause = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: contract,
        value: 0,
        data: contractInterface.encodeFunctionData("unpause"),
        comment: `Unpause contract: ${contractName}`,
        abi: JSON.parse(JSON.stringify(contractInterface.getFunction("unpause"))),
      },
    ]

    return clauses
  }, [contract, contractInterface, contractName])

  const refetchQueryKeys = useMemo(() => {
    return [currentBlockQueryKey(), getQueryToInvalidate(contract)]
  }, [contract])

  return {
    pauseTxResult: useBuildTransaction({
      clauseBuilder: buildPauseClause,
      onSuccess,
      refetchQueryKeys,
    }),
    unpauseTxResult: useBuildTransaction({
      clauseBuilder: buildUnpauseClause,
      onSuccess,
      refetchQueryKeys,
    }),
  }
}

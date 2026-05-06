import { getConfig, getContractsConfig } from "@repo/config"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { getCallClauseQueryKey, useCallClause } from "@vechain/vechain-kit"

const address = getConfig().challengesContractAddress
const abi = B3TRChallenges__factory.abi
const method = "minBetAmount" as const
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export const defaultMinBetAmount = getContractsConfig(getConfig().environment).CHALLENGES_MIN_BET_AMOUNT

export const getMinBetAmountQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to get the minimum bet amount enforced for stake challenges.
 * @returns the current minimum bet amount in wei
 */
export const useMinBetAmount = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      enabled: address.toLowerCase() !== ZERO_ADDRESS,
    },
  })
}

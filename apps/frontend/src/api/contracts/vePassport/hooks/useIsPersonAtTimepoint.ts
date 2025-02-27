import { getCallKey } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress

// Todo: team check and implement in the future for more consistency between SC and FE
export enum PersonStatus {
  DELEGATED = "User has delegated their personhood",
  WHITELISTED = "User is whitelisted",
  BLACKLISTED = "User is blacklisted",
  SIGNALED = "User has been signaled too many times",
  PARTICIPATION_SCORE_QUALIFIED = "User's participation score is above the threshold",
  GALAXY_MEMBER_QUALIFIED = "User's selected Galaxy Member is above the minimum level",
  NOT_QUALIFIED = "User does not meet the criteria to be considered a person",
}

export type IsPersonAtTimepointResult = {
  isPersonAtTimepoint: boolean
  reason: PersonStatus
}

/**
 * Returns the query key for fetching the isPerson status at a given block number.
 * @param user - The user address.
 * @param blockNumber - The block number.
 * @returns The query key for fetching the isPerson status at a given block number.
 */
export const getIsPersonAtTimepointQueryKey = (user?: string, blockNumber?: string) => {
  return getCallKey({ method: "isPersonAtTimepoint", keyArgs: [user, blockNumber] })
}

/**
 * Returns the isPerson status and reason at a given block number
 * @param thor - The thor client.
 * @param user - The user address.
 * @param blockNumber - The block number.
 * @returns The isPerson status at a given block number.
 */
export const getIsPersonAtTimepoint = async (
  thor: Connex.Thor,
  user?: string,
  blockNumber?: string,
): Promise<IsPersonAtTimepointResult> => {
  const functionFragment = VeBetterPassport__factory.createInterface().getFunction("isPersonAtTimepoint").format("json")
  const res = await thor.account(VEPASSPORT_CONTRACT).method(JSON.parse(functionFragment)).call(user, blockNumber)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return {
    isPersonAtTimepoint: res.decoded[0],
    reason: res.decoded[1],
  }
}

/**
 * Hook to get the isPerson status from the VeBetterPassport contract.
 * @param user - The user address.
 * @param blockNumber - The block number.
 * @returns The isPerson status and reason at a given block number.
 */
export const useIsPersonAtTimepoint = (user?: string, blockNumber?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsPersonAtTimepointQueryKey(user, blockNumber),
    queryFn: async () => await getIsPersonAtTimepoint(thor, user, blockNumber),
    enabled: !!user && !!blockNumber,
  })
}

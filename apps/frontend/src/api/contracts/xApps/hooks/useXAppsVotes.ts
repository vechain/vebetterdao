import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { XAllocationVotingGovernor__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { abi } from "thor-devkit"
import { ethers } from "ethers"
import { getXAppVotesQueryKey } from "./useXAppVotes"

const ALLOCATION_VOTING_CONTRACT = getConfig().xAllocationVotingContractAddress
const allocationVotingInterface = XAllocationVotingGovernor__factory.createInterface()

const functionFragment = allocationVotingInterface.getFunction("getAppVotes").format("json")
const functionAbi = new abi.Function(JSON.parse(functionFragment))

/**
 *  Get the clauses to get the votes for the xApps in an allocation round
 * @param apps  the xApps to get the votes for
 * @param roundId  the round id to get the votes for
 * @returns  the clauses to get the votes for the xApps in the round
 */
export const getXAppsVotesClauses = (apps: string[], roundId: string): Connex.VM.Clause[] => {
  const clauses: Connex.VM.Clause[] = apps.map(app => ({
    to: ALLOCATION_VOTING_CONTRACT,
    value: 0,
    data: functionAbi.encode(roundId, app),
  }))
  return clauses
}

/**
 * Fetch the votes of multiple xApps in an allocation round
 * @param apps  the xApps to get the votes for
 * @param roundId  the round id to get the votes for
 * @returns  the number of votes for the xApps in the tound
 */
export const useXAppsVotes = (apps: string[], roundId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getXAppVotesQueryKey(roundId),
    queryFn: async () => {
      const clauses = getXAppsVotesClauses(apps, roundId)
      const res = await thor.explain(clauses).execute()

      const votes = res.map((r, index) => {
        if (r.reverted) throw new Error(`Clause ${index + 1} reverted with reason ${r.revertReason}`)
        const decoded = functionAbi.decode(r.data)

        return {
          app: apps[index] as string,
          votes: r.reverted ? "0" : ethers.formatEther(decoded[0]),
        }
      })
      return votes
    },
    enabled: !!roundId && !!apps.length,
  })
}

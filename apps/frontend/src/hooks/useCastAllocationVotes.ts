import {
  getAllocationVotersQueryKey,
  getAllocationVotesQueryKey,
  getHasVotedInRoundQueryKey,
  getUserVotesInRoundQueryKey,
  getXAppRoundEarningsQueryKey,
  getXAppVotesQueryKey,
} from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { XAllocationVoting__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { ethers } from "ethers"

/**
 * CastAllocationVotesProps is the type of the data to send to the castAllocationVotes hook
 * id is the id of the app to vote
 * value is the percentage of the vote (not scaled)
 */
export type CastAllocationVotesProps = {
  appId: string
  votes: number
}[]

type useCastAllocationVotesProps = {
  roundId: string
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()

type useCastAllocationVotesReturnValue = {
  sendTransaction: (data: CastAllocationVotesProps) => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">
/**
 * Hook to cast votes to one or more apps in a round
 * This hook will send a vote transaction to the blockchain and wait for the txConfirmation
 * @param roundId the id of the round to cast the votes
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link useCastAllocationVotesReturnValue}
 */
export const useCastAllocationVotes = ({
  roundId,
  onSuccess,
  invalidateCache = true,
}: useCastAllocationVotesProps): useCastAllocationVotesReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(
    (data: CastAllocationVotesProps) => {
      const filteredData = data.filter(value => value.votes > 0)

      const apps = filteredData.map(value => value.appId)
      const votes = filteredData.map(value => ethers.parseEther(value.votes.toString()))

      const totalVotes = votes.reduce((acc, vote) => acc + Number(vote), 0)

      const clause: EnhancedClause = {
        to: getConfig().xAllocationVotingContractAddress,
        value: 0,
        data: XAllocationVotingInterface.encodeFunctionData("castVote", [roundId, apps, votes]),
        comment: `Cast your vote on round ${roundId}`,
        abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("castVote"))),
      }

      return [clause]
    },
    [roundId],
  )

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getAllocationVotesQueryKey(roundId),
      })
      await queryClient.refetchQueries({
        queryKey: getAllocationVotesQueryKey(roundId),
      })

      await queryClient.cancelQueries({
        queryKey: getAllocationVotersQueryKey(roundId),
      })
      await queryClient.refetchQueries({
        queryKey: getAllocationVotersQueryKey(roundId),
      })

      await queryClient.cancelQueries({
        queryKey: getXAppVotesQueryKey(undefined, roundId),
      })
      await queryClient.refetchQueries({
        queryKey: getXAppVotesQueryKey(undefined, roundId),
      })

      await queryClient.cancelQueries({
        queryKey: getUserVotesInRoundQueryKey(roundId, account ?? undefined),
      })
      await queryClient.refetchQueries({
        queryKey: getUserVotesInRoundQueryKey(roundId, account ?? undefined),
      })

      await queryClient.cancelQueries({
        queryKey: getHasVotedInRoundQueryKey(roundId, account ?? undefined),
      })
      await queryClient.refetchQueries({
        queryKey: getHasVotedInRoundQueryKey(roundId, account ?? undefined),
      })

      await queryClient.cancelQueries({
        queryKey: getXAppRoundEarningsQueryKey(roundId),
      })
      await queryClient.refetchQueries({
        queryKey: getXAppRoundEarningsQueryKey(roundId),
      })
    }

    onSuccess?.()
  }, [invalidateCache, queryClient, onSuccess, account, roundId])

  const result = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
  })

  /**
   * Send a transaction with the given clauses (in case you need to pass data to build the clauses to mutate directly)
   * @param vote the vote to cast
   * @param reason the reason for the vote
   * @returns see x@xxxx UseSendTransactionReturnValue}
   */
  const onMutate = useCallback(
    async (data: CastAllocationVotesProps) => {
      const clauses = buildClauses(data)
      return result.sendTransaction(clauses)
    },
    [buildClauses, result],
  )

  return { ...result, sendTransaction: onMutate }
}

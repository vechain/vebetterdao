import { VoteType, buildCastVoteTx, getHasVotedQueryKey, getProposalVotesQuerykey } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { address } from "thor-devkit"

type useCastVoteProps = {
  proposalId: string
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

type useCastVoteReturnValue = {
  sendTransaction: (vote: VoteType, reason?: string) => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">
/**
 * Hook to cast a vote on a proposal with the given id
 * This hook will send a vote transaction to the blockchain and wait for the txConfirmation
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link useCastVoteReturnValue}
 */
export const useCastVote = ({
  proposalId,
  onSuccess,
  invalidateCache = true,
}: useCastVoteProps): useCastVoteReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(
    (vote: VoteType, reason?: string) => {
      if (!address) throw new Error("address is required")

      const clauses = buildCastVoteTx(thor, proposalId, vote, reason)
      return [clauses]
    },
    [thor, proposalId],
  )

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getProposalVotesQuerykey(proposalId),
      })
      await queryClient.refetchQueries({
        queryKey: getProposalVotesQuerykey(proposalId),
      })
      await queryClient.cancelQueries({
        queryKey: getHasVotedQueryKey(proposalId, account ?? undefined),
      })
      await queryClient.refetchQueries({
        queryKey: getHasVotedQueryKey(proposalId, account ?? undefined),
      })
    }

    toast({
      title: "Vote casted",
      description: `You have successfully casted your vote on proposal ${proposalId}`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess, account, proposalId])

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
    async (vote: VoteType, reason?: string) => {
      const clauses = buildClauses(vote, reason)
      return result.sendTransaction(clauses)
    },
    [buildClauses, result],
  )

  return { ...result, sendTransaction: onMutate }
}

import { useQuery } from "@tanstack/react-query"
import { getProposalThreshold, getProposalsEvents, getVotes } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

export const useProposalCreatedEvents = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: ["proposalCreatedEvents"],
    queryFn: async () => await getProposalsEvents(thor),
    enabled: !!thor,
  })
}

export const getProposalThresholdQueryKey = () => ["proposalThreshold"]
/**
 *  Hook to get the proposal threshold from the governor contract (i.e the number of votes required to create a proposal)
 * @returns
 */
export const useProposalThreshold = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalThresholdQueryKey(),
    queryFn: async () => await getProposalThreshold(thor),
    enabled: !!thor,
  })
}

export const getVotesQueryKey = (address?: string) => ["votes", address]
/**
 *  Hook to get the votes of the given address
 * @returns
 */
export const useGetVotes = (address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVotesQueryKey(address),
    queryFn: async () => await getVotes(thor, address),
    enabled: !!thor && !!address,
  })
}

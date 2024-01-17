import { useQuery } from "@tanstack/react-query"
import { getProposalsEvents } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

export const useProposalCreatedEvents = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: ["proposalCreatedEvents"],
    queryFn: async () => await getProposalsEvents(thor),
    enabled: !!thor,
  })
}

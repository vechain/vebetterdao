import { useQuery } from "@tanstack/react-query"
import { getProposalCreatedEvents } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

export const useProposalCreatedEvents = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: ["proposalCreatedEvents"],
    queryFn: () => getProposalCreatedEvents(thor),
    enabled: !!thor,
  })
}

import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"

import { getRoundsDates } from "@/app/allocations/history/page"

export const getRoundsDatesQueryKey = () => ["getRoundsDates"]

export const useGetRoundsDates = () => {
  const thor = useThor()

  return useQuery({
    queryKey: getRoundsDatesQueryKey(),
    queryFn: () => getRoundsDates(thor),
  })
}

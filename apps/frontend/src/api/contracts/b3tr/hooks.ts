import { useQuery } from "@tanstack/react-query"
import { getB3trTokenDetails } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

const geB3TrTokenDetailsQueryKey = () => ["b3trTokenDetails"]
export const useB3trTokenDetails = () => {
    const { thor } = useConnex()

    return useQuery({
        queryKey: geB3TrTokenDetailsQueryKey(),
        queryFn: () => getB3trTokenDetails(thor)
    })



}
import { useQuery } from "@tanstack/react-query"
import { getTokenDetails } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

const getTokenDetailsQueryKey = () => ["tokenDetails"]
export const useTokenDetails = () => {
    const { thor } = useConnex()

    return useQuery({
        queryKey: getTokenDetailsQueryKey(),
        queryFn: () => getTokenDetails(thor)
    })



}
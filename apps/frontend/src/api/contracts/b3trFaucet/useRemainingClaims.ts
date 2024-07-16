import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3TRFaucet__factory } from "@repo/contracts"

const B3TRFAUCET_CONTRACT = getConfig().b3trFaucetAddress

export const getRemainingClaims = async (thor: Connex.Thor, account?: string): Promise<string> => {
  console.log("getRemainingClaims", account)

  if (!account) return Promise.reject(new Error("No account provided"))

  const faucetInterface = B3TRFaucet__factory.createInterface()
  const functionFragment = faucetInterface.getFunction("remainingClaimsForToday").format("json")

  const response = await thor.account(B3TRFAUCET_CONTRACT).method(JSON.parse(functionFragment)).call(account)

  if (response.vmError) throw response.vmError

  return response.decoded[0]
}

export const getRemainingClaimsQueryKey = (account?: string) => ["remainingClaims", account]

export const useRemainingClaims = (account: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getRemainingClaimsQueryKey(account ?? ""),
    queryFn: async () => await getRemainingClaims(thor, account),
    enabled: !!thor && !!account,
  })
}

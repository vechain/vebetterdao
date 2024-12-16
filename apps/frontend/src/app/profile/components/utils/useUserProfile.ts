import { useParams } from "next/navigation"
import { useVechainDomain, useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useMemo } from "react"

type Profile = {
  profile: string
  isConnectedUser: boolean
  domain?: string
}

export const useUserProfile = (): Profile => {
  // Comparing the connected use with the profile page params
  const { address: profile } = useParams<{ address: string }>()
  const { account } = useWallet()

  const { domain } = useVechainDomain({ addressOrDomain: profile ?? account })
  const isConnectedUser = useMemo(() => compareAddresses(account ?? "", profile ?? ""), [account, profile])

  return {
    profile: profile ?? account ?? "",
    isConnectedUser,
    domain,
  }
}

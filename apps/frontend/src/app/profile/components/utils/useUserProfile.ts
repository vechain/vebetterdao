import { useParams } from "next/navigation"
import { useVechainDomain, useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useMemo } from "react"
import { humanDomain } from "@repo/utils/FormattingUtils"

type Profile = {
  profile: string | null
  isConnectedUser: boolean
  domain?: string
}

export const useUserProfile = (): Profile => {
  // Comparing the connected use with the profile page params
  const params = useParams<{ address: string }>()
  const profile = params?.address

  const { account } = useWallet()
  const { domain } = useVechainDomain({ addressOrDomain: profile ?? account })

  const isConnectedUser = useMemo(() => compareAddresses(profile, account ?? ""), [account, profile])

  // Not in the profil page, so on the connected user page profile
  if (!profile && account) {
    return {
      profile: account,
      isConnectedUser: true,
      domain: humanDomain(domain ?? "", 4, 26),
    }
  }

  return {
    profile: profile,
    isConnectedUser,
    domain: humanDomain(domain ?? "", 4, 26),
  }
}

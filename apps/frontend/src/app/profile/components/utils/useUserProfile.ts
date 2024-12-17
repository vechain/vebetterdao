import { useParams, usePathname } from "next/navigation"
import { useVechainDomain, useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useMemo } from "react"
import { humanDomain } from "@repo/utils/FormattingUtils"

type Profile = {
  profile: string | null
  isConnectedUser: boolean
  domain?: string
  isOnProfilePage?: boolean // true if the user is on profile page
}

export const useUserProfile = (): Profile => {
  // Comparing the connected use with the profile page params
  const params = useParams<{ address: string }>()
  const pathname = usePathname()
  const profile = params?.address

  const { account } = useWallet()
  const { domain } = useVechainDomain({ addressOrDomain: profile ?? account })

  const isConnectedUser = useMemo(() => compareAddresses(profile, account ?? ""), [account, profile])
  const isOnProfilePage = pathname.includes("profile")

  // Not in the profil page, so on the connected user page profile
  if (!profile && account) {
    return {
      profile: account,
      isConnectedUser: true,
      domain: humanDomain(domain ?? "", 4, 26),
      isOnProfilePage,
    }
  }

  return {
    profile: profile,
    isConnectedUser,
    domain: humanDomain(domain ?? "", 4, 26),
    isOnProfilePage,
  }
}

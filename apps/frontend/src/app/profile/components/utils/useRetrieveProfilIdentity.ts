import { useParams, usePathname } from "next/navigation"
import { useWallet, useVechainDomain } from "@vechain/vechain-kit"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useMemo } from "react"
import { humanDomain } from "@repo/utils/FormattingUtils"

type Profile = {
  profile: string | undefined
  isConnectedUser: boolean
  domain?: string
  isOnProfilePage?: boolean // true if the user is on profile page
  viewMode?: boolean
}

export const useRetrieveProfilIdentity = (): Profile => {
  // Comparing the connected user with the profile page params
  const params = useParams<{ address: string }>()
  const pathname = usePathname()
  const profile = params?.address

  const { account } = useWallet()

  const isConnectedUser = useMemo(() => compareAddresses(profile, account?.address ?? ""), [account, profile])
  const isOnProfilePage = useMemo(() => (pathname ? pathname.includes("profile") : false), [pathname])

  const viewMode = isOnProfilePage && !!profile
  const { data: vnsAccountData } = useVechainDomain(account?.address)
  const domainFromAccount = vnsAccountData?.domain
  const { data: vnsProfileData } = useVechainDomain(profile)
  const domainFromProfile = vnsProfileData?.domain
  // if i'm in the profile page, but the 'profile' is empty, then I'm in the profile page of the connected user
  // see url be like : /profile?tab...
  if (!profile && isOnProfilePage && account?.address) {
    return {
      profile: account?.address,
      isConnectedUser: true,
      domain: humanDomain(domainFromAccount ?? "", 3, 10),
      isOnProfilePage,
      viewMode,
    }
  }

  return {
    profile: profile,
    isConnectedUser,
    domain: humanDomain(domainFromProfile ?? "", 3, 10),
    isOnProfilePage,
    viewMode,
  }
}

import { Link, VisuallyHidden } from "@chakra-ui/react"
import { UilSetting } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useParams } from "next/navigation"
import { useMemo } from "react"

import { useAccountPermissions } from "../../../../../../api/contracts/account/hooks/useAccountPermissions"
import { useCurrentAppAdmin } from "../../../hooks/useCurrentAppAdmin"

export const AdminAppPageButton = () => {
  const { appId } = useParams()
  const { account } = useWallet()
  const { admin } = useCurrentAppAdmin()
  const { data: permissions } = useAccountPermissions(account?.address || "")
  const showAdminButton = useMemo(
    () => compareAddresses(account?.address || "", admin) || permissions?.isAdminOfX2EarnApps,
    [account, admin, permissions],
  )
  if (!showAdminButton) {
    return null
  }
  return (
    <Link asChild>
      <NextLink href={`/apps/${appId}/admin`}>
        <VisuallyHidden>{"Admin App Page"}</VisuallyHidden>
        <UilSetting size="20px" />
      </NextLink>
    </Link>
  )
}

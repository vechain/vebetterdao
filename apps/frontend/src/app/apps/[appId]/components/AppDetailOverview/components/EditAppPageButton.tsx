import { Link, VisuallyHidden } from "@chakra-ui/react"
import { UilPen } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useParams } from "next/navigation"
import { useMemo } from "react"

import { useCurrentAppModerators } from "../../../hooks/useCurrentAppModerators"
import { useCurrentAppAdmin } from "../../../hooks/useCurrentAppAdmin"
import { useAccountPermissions } from "../../../../../../api/contracts/account/hooks/useAccountPermissions"

export const EditAppPageButton = () => {
  const { appId } = useParams()
  const { account } = useWallet()
  const { admin } = useCurrentAppAdmin()
  const { moderators } = useCurrentAppModerators()
  const { data: permissions } = useAccountPermissions(account?.address || "")
  const showEditButton = useMemo(() => {
    if (compareAddresses(account?.address || "", admin)) return true
    if (moderators?.find(moderator => compareAddresses(account?.address || "", moderator))) return true
    if (permissions?.isAdminOfX2EarnApps) return true
    return false
  }, [account, admin, moderators, permissions])
  if (!showEditButton) {
    return null
  }
  return (
    <Link asChild>
      <NextLink href={`/apps/${appId}/edit`}>
        <VisuallyHidden>{"Edit App Page"}</VisuallyHidden>
        <UilPen size="20px" />
      </NextLink>
    </Link>
  )
}

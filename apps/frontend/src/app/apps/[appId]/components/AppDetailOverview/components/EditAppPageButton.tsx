import { Link, VisuallyHidden } from "@chakra-ui/react"
import { UilPen } from "@iconscout/react-unicons"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { useCurrentAppAdmin, useCurrentAppModerators } from "../../../hooks"
import { useWallet } from "@vechain/vechain-kit"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useAccountPermissions } from "@/api/contracts/account"
import NextLink from "next/link"

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

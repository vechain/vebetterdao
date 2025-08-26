import { IconButton } from "@chakra-ui/react"
import { UilPen } from "@iconscout/react-unicons"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useCurrentAppAdmin, useCurrentAppModerators } from "../../../hooks"
import { useWallet } from "@vechain/vechain-kit"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useAccountPermissions } from "@/api/contracts/account"

export const EditAppPageButton = () => {
  const { appId } = useParams()

  const router = useRouter()
  const handleEdit = useCallback(() => {
    router.push(`/apps/${appId}/edit`)
  }, [appId, router])

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
    <IconButton variant="primaryIconButton" aria-label="Edit App Page" onClick={handleEdit}>
      <UilPen size="20px" />
    </IconButton>
  )
}

import { IconButton } from "@chakra-ui/react"
import { UilSetting } from "@iconscout/react-unicons"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useCurrentAppAdmin } from "../../../hooks"
import { useWallet } from "@vechain/vechain-kit"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useAccountPermissions } from "@/api/contracts/account"

export const AdminAppPageButton = () => {
  const { appId } = useParams()

  const router = useRouter()
  const handleAdmin = useCallback(() => {
    router.push(`/apps/${appId}/admin`)
  }, [appId, router])

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
    <IconButton variant="primaryIconButton" aria-label="Admin App Page" onClick={handleAdmin}>
      <UilSetting size="20px" />
    </IconButton>
  )
}

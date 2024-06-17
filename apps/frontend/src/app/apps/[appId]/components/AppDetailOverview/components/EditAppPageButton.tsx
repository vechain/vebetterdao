import { IconButton } from "@chakra-ui/react"
import { UilPen } from "@iconscout/react-unicons"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useCurrentAppAdmin, useCurrentAppModerators } from "../../../hooks"
import { useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"

export const EditAppPageButton = () => {
  const { appId } = useParams()

  const router = useRouter()
  const handleEdit = useCallback(() => {
    router.push(`/apps/${appId}/edit`)
  }, [appId, router])

  const { account } = useWallet()
  const { admin } = useCurrentAppAdmin()
  const { moderators } = useCurrentAppModerators()

  const showEditButton = useMemo(() => {
    if (compareAddresses(account || "", admin)) return true
    if (moderators?.find(moderator => compareAddresses(account || "", moderator))) return true
    return false
  }, [account, admin, moderators])

  if (!showEditButton) {
    return null
  }

  return (
    <>
      <IconButton variant="primaryIconButton" aria-label="Edit App Page" onClick={handleEdit}>
        <UilPen size="20px" />
      </IconButton>
    </>
  )
}

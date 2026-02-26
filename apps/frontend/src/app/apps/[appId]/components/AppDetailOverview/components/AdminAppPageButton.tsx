import { Button } from "@chakra-ui/react"
import { UilSetting } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAccountPermissions } from "../../../../../../api/contracts/account/hooks/useAccountPermissions"
import { useCurrentAppAdmin } from "../../../hooks/useCurrentAppAdmin"

export const AdminAppPageButton = () => {
  const { t } = useTranslation()
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
    <Button variant="tertiary" size="sm" asChild>
      <NextLink href={`/apps/${appId}/admin`}>
        <UilSetting size="16px" />
        {t("Admin")}
      </NextLink>
    </Button>
  )
}

import { Button, Card, Heading, HStack, Separator, VStack, useDisclosure } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAccountPermissions } from "../../../../../../api/contracts/account/hooks/useAccountPermissions"
import { useCurrentAppAdmin } from "../../../hooks/useCurrentAppAdmin"
import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { useCurrentAppMetadata } from "../../../hooks/useCurrentAppMetadata"

import { AdminSettingSection } from "./components/AdminSettingSection"
import { DangerZoneCard } from "./components/DangerZoneCard"
import { ManageAdminModal } from "./components/ManageAdminModal"
import { ManageCreatorsModal } from "./components/ManageCreatorsModal"
import { ManageDistributorsModal } from "./components/ManageDistributorsModal"
import { ManageModeratorsModal } from "./components/ManageModeratorsModal"
import { ManageSignalersModal } from "./components/ManageSignalersModal"
import { ManageTreasuryModal } from "./components/ManageTreasuryModal"

export const AdminAppPageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address || "")
  const { admin } = useCurrentAppAdmin()
  const { app } = useCurrentAppInfo()
  const { appMetadata } = useCurrentAppMetadata()

  const creatorsModal = useDisclosure()
  const moderatorsModal = useDisclosure()
  const signalersModal = useDisclosure()
  const distributorsModal = useDisclosure()
  const treasuryModal = useDisclosure()
  const adminModal = useDisclosure()

  const allowedToEditAdminInfo = useMemo(
    () => compareAddresses(account?.address || "", admin) || permissions?.isAdminOfX2EarnApps,
    [account, admin, permissions],
  )

  const goBack = useCallback(() => {
    router.push(`/apps/${app?.id}`)
  }, [app?.id, router])

  useEffect(() => {
    if (!allowedToEditAdminInfo) {
      router.push(`/apps/${app?.id}`)
    }
  }, [allowedToEditAdminInfo, app?.id, router])

  if (!allowedToEditAdminInfo) return null

  return (
    <Card.Root variant="primary" w="full">
      <Card.Body>
        <VStack gap={8} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="4xl">{t("{{app}} settings", { app: appMetadata?.name })}</Heading>
            <Button variant="secondary" onClick={goBack}>
              {t("Go back")}
            </Button>
          </HStack>

          <VStack align="stretch" gap={0}>
            <AdminSettingSection
              title={t("Creator NFT")}
              description={t(
                "Add creators to your app, allowing them to join Discord channels gated only to app owners.",
              )}
              onManage={creatorsModal.onOpen}
            />
            <Separator />
            <AdminSettingSection
              title={t("Moderators")}
              description={t("Manage users who can update the feed and visual data on the profile.")}
              onManage={moderatorsModal.onOpen}
            />
            <Separator />
            <AdminSettingSection
              title={t("Signalers")}
              description={t("Manage users who can bot-signal and reset signal counts for individual users.")}
              onManage={signalersModal.onOpen}
            />
          </VStack>

          <DangerZoneCard>
            <AdminSettingSection
              title={t("Reward Distributors")}
              description={t("Manage addresses that can distribute rewards and withdraw funds from the app.")}
              onManage={distributorsModal.onOpen}
            />
            <AdminSettingSection
              title={t("Treasury address")}
              description={t("Change where B3TR tokens are sent when withdrawing allocations.")}
              onManage={treasuryModal.onOpen}
            />
            <AdminSettingSection
              title={t("Admin address")}
              description={t("Transfer app ownership to another address. This action is irreversible.")}
              onManage={adminModal.onOpen}
            />
          </DangerZoneCard>
        </VStack>

        <ManageCreatorsModal isOpen={creatorsModal.open} onClose={creatorsModal.onClose} />
        <ManageModeratorsModal isOpen={moderatorsModal.open} onClose={moderatorsModal.onClose} />
        <ManageSignalersModal isOpen={signalersModal.open} onClose={signalersModal.onClose} />
        <ManageDistributorsModal isOpen={distributorsModal.open} onClose={distributorsModal.onClose} />
        <ManageTreasuryModal isOpen={treasuryModal.open} onClose={treasuryModal.onClose} />
        <ManageAdminModal isOpen={adminModal.open} onClose={adminModal.onClose} />
      </Card.Body>
    </Card.Root>
  )
}

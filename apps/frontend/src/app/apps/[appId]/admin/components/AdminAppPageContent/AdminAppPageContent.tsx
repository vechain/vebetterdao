import { Button, Card, CardBody, Divider, HStack, Heading, VStack, useDisclosure } from "@chakra-ui/react"
import { useCurrentAppAdmin, useCurrentAppMetadata, useCurrentAppModerators } from "../../../hooks"
import { useTranslation } from "react-i18next"
import { EditAppModerators } from "./components/EditAppModerators"
import { EditAppAddresses } from "./components/EditAppAddresses"
import { useForm } from "react-hook-form"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UpdateConfirmationModal } from "./components/UpdateConfirmationModal"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { useUpdateAppAdminInfo } from "@/hooks/useUpdateAppAdminInfo"
import { TransactionModal } from "@/components/TransactionModal"
import { useWallet } from "@vechain/dapp-kit-react"

export type AdminAppForm = {
  adminAddress: string
  teamWalletAddress: string
  moderators: string[]
}

export const AdminAppPageContent = () => {
  const { appMetadata } = useCurrentAppMetadata()
  const { moderators } = useCurrentAppModerators()
  const { t } = useTranslation()
  const [editAdminAddress, setEditAdminAddress] = useState(false)
  const [editTeamWalletAddress, setEditTeamWalletAddress] = useState(false)
  const updateConfirmationModal = useDisclosure()
  const { admin } = useCurrentAppAdmin()
  const { app } = useCurrentAppInfo()
  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()

  const form = useForm<AdminAppForm>({
    defaultValues: {
      moderators,
      adminAddress: admin || "",
      teamWalletAddress: app?.teamWalletAddress || "",
    },
  })

  const [adminAddress, teamWalletAddress, newModerators] = form.watch([
    "adminAddress",
    "teamWalletAddress",
    "moderators",
  ])

  const isAdminAddressChanged = !compareAddresses(adminAddress, admin || "")
  const isTeamWalletAddressChanged = !compareAddresses(teamWalletAddress, app?.teamWalletAddress || "")
  const isModeratorsChanged =
    moderators.length !== newModerators.length ||
    !moderators.every((moderator, index) => compareAddresses(moderator, newModerators[index]))
  const disableSaveButton = !isAdminAddressChanged && !isTeamWalletAddressChanged && !isModeratorsChanged
  const router = useRouter()

  const updateMutation = useUpdateAppAdminInfo({
    appId: app?.id || "",
    onSuccess: () => {
      onConfirmationClose()
      router.back()
      form.reset()
      updateMutation.resetStatus()
    },
  })

  const handleClose = useCallback(() => {
    onConfirmationClose()
    updateMutation.resetStatus()
  }, [onConfirmationClose, updateMutation])

  const goBack = useCallback(() => {
    onConfirmationClose()
    router.back()
    form.reset()
    updateMutation.resetStatus()
  }, [form, onConfirmationClose, router, updateMutation])

  const onSubmit = useCallback(
    (data: AdminAppForm) => {
      onConfirmationOpen()
      const moderatorsToBeAdded = data.moderators.filter(
        newModerator => !moderators.some(moderator => compareAddresses(moderator, newModerator)),
      )
      const moderatorsToBeRemoved = moderators.filter(
        moderator => !data.moderators.some(newModerator => compareAddresses(moderator, newModerator)),
      )
      updateMutation.sendTransaction({
        appId: app?.id || "",
        adminAddress: isAdminAddressChanged ? data.adminAddress : undefined,
        teamWalletAddress: isTeamWalletAddressChanged ? data.teamWalletAddress : undefined,
        moderatorsToBeAdded,
        moderatorsToBeRemoved,
      })
    },
    [app?.id, isAdminAddressChanged, isTeamWalletAddressChanged, moderators, onConfirmationOpen, updateMutation],
  )

  const checkAddresses = useCallback(
    (data: AdminAppForm) => {
      if (isAdminAddressChanged || isTeamWalletAddressChanged) {
        updateConfirmationModal.onOpen()
        return
      }
      onSubmit(data)
    },
    [isAdminAddressChanged, isTeamWalletAddressChanged, onSubmit, updateConfirmationModal],
  )

  const onTryAgain = useCallback(() => {
    handleClose()
    form.handleSubmit(onSubmit)()
  }, [form, handleClose, onSubmit])

  const { account } = useWallet()

  const allowedToEditAdminInfo = compareAddresses(account || "", admin)

  useEffect(() => {
    if (!allowedToEditAdminInfo) {
      router.push(`/apps/${app?.id}`)
    }
  }, [allowedToEditAdminInfo, app?.id, router])

  if (!allowedToEditAdminInfo) {
    return null
  }

  return (
    <>
      <Card variant="baseWithBorder" w="full">
        <CardBody>
          <VStack gap="48px" align="stretch" as="form" onSubmit={form.handleSubmit(checkAddresses)}>
            <Heading fontSize={"36px"} fontWeight={700}>
              {t("{{app}} settings", { app: appMetadata?.name })}
            </Heading>
            <EditAppModerators form={form} />
            <Divider />
            <EditAppAddresses
              form={form}
              editAdminAddress={editAdminAddress}
              setEditAdminAddress={setEditAdminAddress}
              editTeamWalletAddress={editTeamWalletAddress}
              setEditTeamWalletAddress={setEditTeamWalletAddress}
            />
            <HStack justify={"space-between"} mt={8}>
              <Button variant="primaryGhost" onClick={goBack}>
                {t("Go back")}
              </Button>
              <Button variant="primaryAction" type="submit" isDisabled={disableSaveButton}>
                {t("Save all changes")}
              </Button>
            </HStack>
          </VStack>
          <UpdateConfirmationModal
            {...updateConfirmationModal}
            form={form}
            onSubmit={form.handleSubmit(onSubmit)}
            isAdminAddressChanged={isAdminAddressChanged}
            isTeamWalletAddressChanged={isTeamWalletAddressChanged}
          />
        </CardBody>
      </Card>
      <TransactionModal
        isOpen={isConfirmationOpen}
        onClose={handleClose}
        confirmationTitle="Update app admin info"
        successTitle="App admin info updated!"
        status={updateMutation.status}
        errorDescription={updateMutation.error?.reason}
        errorTitle={"Error updating app admin info"}
        showTryAgainButton={true}
        onTryAgain={onTryAgain}
        pendingTitle="Updating app admin info..."
        txId={updateMutation.txReceipt?.meta.txID}
        showExplorerButton
      />
    </>
  )
}

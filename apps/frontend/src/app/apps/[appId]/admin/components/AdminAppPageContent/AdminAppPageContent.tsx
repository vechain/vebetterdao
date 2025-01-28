import { Button, Card, CardBody, Divider, HStack, Heading, VStack, useDisclosure } from "@chakra-ui/react"
import {
  useCurrentAppAdmin,
  useCurrentAppCreators,
  useCurrentAppMetadata,
  useCurrentAppModerators,
  useCurrentAppRewardDistributors,
} from "../../../hooks"
import { useTranslation } from "react-i18next"
import { EditAppModerators } from "./components/EditAppModerators"
import { EditAppAddresses } from "./components/EditAppAddresses"
import { useForm } from "react-hook-form"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { UpdateConfirmationModal } from "./components/UpdateConfirmationModal"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { useUpdateAppAdminInfo } from "@/hooks/useUpdateAppAdminInfo"
import { TransactionModal } from "@/components/TransactionModal"
import { useWallet } from "@vechain/vechain-kit"
import { EditAppRewardDistributors } from "./components/EditAppRewardDistributors"
import { useAccountPermissions } from "@/api/contracts/account"
import { EditAppCreatorNFT } from "./components/EditAppCreatorNFT"

export type AdminAppForm = {
  adminAddress: string
  teamWalletAddress: string
  moderators: string[]
  creators: string[]
  distributors: string[]
}

export const AdminAppPageContent = () => {
  const { appMetadata } = useCurrentAppMetadata()
  const { moderators } = useCurrentAppModerators()
  const { creators } = useCurrentAppCreators()
  const { distributors } = useCurrentAppRewardDistributors()

  const { t } = useTranslation()
  const [editAdminAddress, setEditAdminAddress] = useState(false)
  const [editTeamWalletAddress, setEditTeamWalletAddress] = useState(false)
  const updateConfirmationModal = useDisclosure()
  const { admin } = useCurrentAppAdmin()
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address || "")
  const { app } = useCurrentAppInfo()
  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()

  const form = useForm<AdminAppForm>({
    defaultValues: {
      moderators,
      creators,
      adminAddress: admin || "",
      teamWalletAddress: app?.teamWalletAddress || "",
      distributors,
    },
  })

  const [adminAddress, teamWalletAddress, newModerators, newDistributors, newCreators] = form.watch([
    "adminAddress",
    "teamWalletAddress",
    "moderators",
    "distributors",
    "creators",
  ])

  // Update the form values when the app fetches the data from blockchain
  useEffect(() => {
    form.setValue("moderators", moderators)
  }, [moderators, form])
  useEffect(() => {
    form.setValue("distributors", distributors)
  }, [distributors, form])
  useEffect(() => {
    form.setValue("creators", creators)
  }, [creators, form])

  const isAdminAddressChanged = !compareAddresses(adminAddress, admin || "")
  const isTeamWalletAddressChanged = !compareAddresses(teamWalletAddress, app?.teamWalletAddress || "")
  const isModeratorsChanged =
    moderators.length !== newModerators.length ||
    !moderators.every((moderator, index) => compareAddresses(moderator, newModerators[index]))
  const isDistributorsChanged =
    distributors.length !== newDistributors.length ||
    !distributors.every((distributor, index) => compareAddresses(distributor, newDistributors[index]))
  const isCreatorsChanged =
    creators.length !== newCreators.length ||
    !creators.every((creator, index) => compareAddresses(creator, newCreators[index]))
  const disableSaveButton =
    !isAdminAddressChanged &&
    !isTeamWalletAddressChanged &&
    !isModeratorsChanged &&
    !isDistributorsChanged &&
    !isCreatorsChanged
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

      const distributorsToBeAdded = data.distributors.filter(
        newDistributor => !distributors.some(distributor => compareAddresses(distributor, newDistributor)),
      )
      const distributorsToBeRemoved = distributors.filter(
        distributor => !data.distributors.some(newDistributor => compareAddresses(distributor, newDistributor)),
      )
      const creatorsToBeAdded = data.creators.filter(
        newCreator => !creators.some(creator => compareAddresses(creator, newCreator)),
      )
      const creatorsToBeRemoved = creators.filter(
        creator => !data.creators.some(newCreator => compareAddresses(creator, newCreator)),
      )

      updateMutation.sendTransaction({
        appId: app?.id || "",
        adminAddress: isAdminAddressChanged ? data.adminAddress : undefined,
        teamWalletAddress: isTeamWalletAddressChanged ? data.teamWalletAddress : undefined,
        moderatorsToBeAdded,
        moderatorsToBeRemoved,
        distributorsToBeAdded,
        distributorsToBeRemoved,
        creatorsToBeAdded,
        creatorsToBeRemoved,
      })
    },
    [
      onConfirmationOpen,
      moderators,
      distributors,
      creators,
      updateMutation,
      app?.id,
      isAdminAddressChanged,
      isTeamWalletAddressChanged,
    ],
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

  const allowedToEditAdminInfo = useMemo(
    () => compareAddresses(account?.address || "", admin) || permissions?.isAdminOfX2EarnApps,
    [account, admin, permissions],
  )

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
            <EditAppCreatorNFT form={form} />
            <Divider />
            <EditAppModerators form={form} />
            <Divider />
            <EditAppAddresses
              form={form}
              editAdminAddress={editAdminAddress}
              setEditAdminAddress={setEditAdminAddress}
              editTeamWalletAddress={editTeamWalletAddress}
              setEditTeamWalletAddress={setEditTeamWalletAddress}
            />
            <EditAppRewardDistributors form={form} />
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

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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { UpdateConfirmationModal } from "./components/UpdateConfirmationModal"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { useUpdateAppAdminInfo } from "@/hooks/useUpdateAppAdminInfo"
import { TransactionModal } from "@/components/TransactionModal"
import { useWallet } from "@vechain/dapp-kit-react"
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
  const { moderators, isLoading: moderatorsLoading } = useCurrentAppModerators()
  const { creators, isLoading: creatorsLoading } = useCurrentAppCreators()
  const { distributors, isLoading: distributorsLoading } = useCurrentAppRewardDistributors()

  const { t } = useTranslation()
  const [editAdminAddress, setEditAdminAddress] = useState(false)
  const [editTeamWalletAddress, setEditTeamWalletAddress] = useState(false)
  const updateConfirmationModal = useDisclosure()
  const { admin, isLoading: adminLoading } = useCurrentAppAdmin()
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account || "")
  const { app, isAppInfoLoading: appLoading } = useCurrentAppInfo()
  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()

  const storedAddress = useRef({
    admin: "",
    moderators: [] as string[],
    creators: [] as string[],
    distributors: [] as string[],
    teamWalletAddress: "",
  })

  const isAddressLoading = adminLoading || appLoading || moderatorsLoading || creatorsLoading || distributorsLoading

  const form = useForm<AdminAppForm>({
    defaultValues: {
      moderators: [],
      creators: [],
      adminAddress: "",
      teamWalletAddress: "",
      distributors: [],
    },
  })

  const syncForm = useCallback(() => {
    if (!admin || !app?.teamWalletAddress) return

    storedAddress.current = {
      admin: admin || "",
      moderators: [...(moderators || [])],
      creators: [...(creators || [])],
      distributors: [...(distributors || [])],
      teamWalletAddress: app?.teamWalletAddress || "",
    }

    // Resetting the form with the most updated values onchain
    form.reset({
      adminAddress: storedAddress.current.admin,
      moderators: storedAddress.current.moderators,
      creators: storedAddress.current.creators,
      distributors: storedAddress.current.distributors,
      teamWalletAddress: storedAddress.current.teamWalletAddress,
    })
  }, [admin, app?.teamWalletAddress, creators, distributors, form, moderators])

  useEffect(() => {
    if (!isAddressLoading && admin && app?.teamWalletAddress) {
      syncForm()
    }
  }, [admin, app?.teamWalletAddress, syncForm, moderators, creators, distributors, isAddressLoading])

  const [adminAddress, teamWalletAddress, newModerators, newDistributors, newCreators] = form.watch([
    "adminAddress",
    "teamWalletAddress",
    "moderators",
    "distributors",
    "creators",
  ])

  const isAdminAddressChanged = !compareAddresses(adminAddress, storedAddress.current.admin)
  const isTeamWalletAddressChanged = !compareAddresses(teamWalletAddress, storedAddress.current.teamWalletAddress)
  const isModeratorsChanged =
    storedAddress.current.moderators.length !== newModerators.length ||
    !storedAddress.current.moderators.every(
      (moderator, index) => newModerators[index] && compareAddresses(moderator, newModerators[index]),
    )

  const isDistributorsChanged =
    storedAddress.current.distributors.length !== newDistributors.length ||
    !storedAddress.current.distributors.every(
      (distributor, index) => newDistributors[index] && compareAddresses(distributor, newDistributors[index]),
    )

  const isCreatorsChanged =
    storedAddress.current.creators.length !== newCreators.length ||
    !storedAddress.current.creators.every(
      (creator, index) => newCreators[index] && compareAddresses(creator, newCreators[index]),
    )

  const hasUnsavedChanges =
    isAdminAddressChanged ||
    isTeamWalletAddressChanged ||
    isModeratorsChanged ||
    isDistributorsChanged ||
    isCreatorsChanged

  const disableSaveButton = !hasUnsavedChanges
  const router = useRouter()

  const updateMutation = useUpdateAppAdminInfo({
    appId: app?.id || "",
    onSuccess: () => {
      onConfirmationClose()
      // After successful transaction, update the reference with form values
      storedAddress.current = {
        admin: adminAddress,
        moderators: [...newModerators],
        creators: [...newCreators],
        distributors: [...newDistributors],
        teamWalletAddress: teamWalletAddress,
      }
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

      // Calculate changes based on the initial snapshot
      const moderatorsToBeAdded = data.moderators.filter(
        newModerator => !storedAddress.current.moderators.some(moderator => compareAddresses(moderator, newModerator)),
      )
      const moderatorsToBeRemoved = storedAddress.current.moderators.filter(
        moderator => !data.moderators.some(newModerator => compareAddresses(moderator, newModerator)),
      )

      const distributorsToBeAdded = data.distributors.filter(
        newDistributor =>
          !storedAddress.current.distributors.some(distributor => compareAddresses(distributor, newDistributor)),
      )
      const distributorsToBeRemoved = storedAddress.current.distributors.filter(
        distributor => !data.distributors.some(newDistributor => compareAddresses(distributor, newDistributor)),
      )
      const creatorsToBeAdded = data.creators.filter(
        newCreator => !storedAddress.current.creators.some(creator => compareAddresses(creator, newCreator)),
      )
      const creatorsToBeRemoved = storedAddress.current.creators.filter(
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
    [onConfirmationOpen, updateMutation, app?.id, isAdminAddressChanged, isTeamWalletAddressChanged],
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
    () => compareAddresses(account || "", admin) || permissions?.isAdminOfX2EarnApps,
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

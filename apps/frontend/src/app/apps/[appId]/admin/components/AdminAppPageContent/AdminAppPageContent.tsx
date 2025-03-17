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
  const { t } = useTranslation()
  const router = useRouter()

  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account || "")

  const { admin, isLoading: adminLoading } = useCurrentAppAdmin()
  const { moderators, isLoading: moderatorsLoading } = useCurrentAppModerators()
  const { creators, isLoading: creatorsLoading } = useCurrentAppCreators()
  const { distributors, isLoading: distributorsLoading } = useCurrentAppRewardDistributors()
  const { app, isAppInfoLoading: appLoading } = useCurrentAppInfo()
  const { appMetadata } = useCurrentAppMetadata()

  const [editAdminAddress, setEditAdminAddress] = useState(false)
  const [editTeamWalletAddress, setEditTeamWalletAddress] = useState(false)

  const updateConfirmationModal = useDisclosure()
  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()

  const onchainAddresses = useRef({
    moderators: [] as string[],
    creators: [] as string[],
    adminAddress: "",
    teamWalletAddress: "",
    distributors: [] as string[],
  })

  const isAddressesLoading = adminLoading || appLoading || moderatorsLoading || creatorsLoading || distributorsLoading

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

    const newOnchainAddresses = {
      moderators: [...(moderators || [])],
      creators: [...(creators || [])],
      adminAddress: admin || "",
      teamWalletAddress: app?.teamWalletAddress || "",
      distributors: [...(distributors || [])],
    }
    onchainAddresses.current = newOnchainAddresses
    // Resetting the form with the most updated values onchain
    form.reset(newOnchainAddresses)
  }, [admin, app?.teamWalletAddress, creators, distributors, form, moderators])

  useEffect(() => {
    if (!isAddressesLoading && admin && app?.teamWalletAddress) {
      syncForm()
    }
  }, [admin, app?.teamWalletAddress, syncForm, moderators, creators, distributors, isAddressesLoading])

  const [adminAddress, teamWalletAddress, newModerators, newDistributors, newCreators] = form.watch([
    "adminAddress",
    "teamWalletAddress",
    "moderators",
    "distributors",
    "creators",
  ])

  const haveAddressesChanged = (currentAddresses: string[], newAddresses: string[]) => {
    if (currentAddresses.length !== newAddresses.length) return true
    return !currentAddresses.every(
      (address, index) => newAddresses[index] && compareAddresses(address, newAddresses[index]),
    )
  }

  const getAddressesToAdd = (newAddresses: string[], currentAddresses: string[]) =>
    newAddresses.filter(newAddress => !currentAddresses.some(address => compareAddresses(address, newAddress)))

  const getAddressesToRemove = (currentAddresses: string[], newAddresses: string[]) =>
    currentAddresses.filter(address => !newAddresses.some(newAddress => compareAddresses(address, newAddress)))

  // Check if addresses have changed
  const isAdminAddressChanged = !compareAddresses(adminAddress, onchainAddresses.current.adminAddress)
  const isTeamWalletAddressChanged = !compareAddresses(teamWalletAddress, onchainAddresses.current.teamWalletAddress)
  const isModeratorsChanged = haveAddressesChanged(onchainAddresses.current.moderators, newModerators)
  const isDistributorsChanged = haveAddressesChanged(onchainAddresses.current.distributors, newDistributors)
  const isCreatorsChanged = haveAddressesChanged(onchainAddresses.current.creators, newCreators)

  const hasUnsavedChanges =
    isAdminAddressChanged ||
    isTeamWalletAddressChanged ||
    isModeratorsChanged ||
    isDistributorsChanged ||
    isCreatorsChanged
  const disableSaveButton = !hasUnsavedChanges

  const updateMutation = useUpdateAppAdminInfo({
    appId: app?.id || "",
    onSuccess: () => {
      onConfirmationClose()
      // After successful transaction, update the reference with form values
      onchainAddresses.current = {
        adminAddress: adminAddress,
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
    router.push(`/apps/${app?.id}`)
    form.reset()
    updateMutation.resetStatus()
  }, [form, onConfirmationClose, router, updateMutation])

  const onSubmit = useCallback(
    (data: AdminAppForm) => {
      onConfirmationOpen()

      const moderatorsToBeAdded = getAddressesToAdd(data.moderators, onchainAddresses.current.moderators)
      const moderatorsToBeRemoved = getAddressesToRemove(onchainAddresses.current.moderators, data.moderators)

      const distributorsToBeAdded = getAddressesToAdd(data.distributors, onchainAddresses.current.distributors)
      const distributorsToBeRemoved = getAddressesToRemove(onchainAddresses.current.distributors, data.distributors)

      const creatorsToBeAdded = getAddressesToAdd(data.creators, onchainAddresses.current.creators)
      const creatorsToBeRemoved = getAddressesToRemove(onchainAddresses.current.creators, data.creators)

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

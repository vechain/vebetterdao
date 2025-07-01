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
import { useWallet } from "@vechain/vechain-kit"
import { EditAppRewardDistributors } from "./components/EditAppRewardDistributors"
import { useAccountPermissions } from "@/api/contracts/account"
import { EditAppCreatorNFT } from "./components/EditAppCreatorNFT"
import { useCurrentAppSignalers } from "../../../hooks/useCurrentAppSignalers"
import { EditAppSignalers } from "./components/EditAppSignalers"

export type AdminAppForm = {
  adminAddress: string
  teamWalletAddress: string
  moderators: string[]
  creators: string[]
  distributors: string[]
  signalers: string[]
}

export const AdminAppPageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()

  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address || "")

  const { admin, isLoading: adminLoading } = useCurrentAppAdmin()
  const { moderators, isLoading: moderatorsLoading } = useCurrentAppModerators()
  const { creators, isLoading: creatorsLoading } = useCurrentAppCreators()
  const { distributors, isLoading: distributorsLoading } = useCurrentAppRewardDistributors()
  const { activeSignalers: signalers, isLoading: signalersLoading } = useCurrentAppSignalers()
  const { app, isAppInfoLoading: appLoading } = useCurrentAppInfo()
  const { appMetadata } = useCurrentAppMetadata()

  const [editAdminAddress, setEditAdminAddress] = useState(false)
  const [editTeamWalletAddress, setEditTeamWalletAddress] = useState(false)

  const updateConfirmationModal = useDisclosure()
  const onchainAddresses = useRef({
    moderators: [] as string[],
    creators: [] as string[],
    adminAddress: "",
    teamWalletAddress: "",
    distributors: [] as string[],
    signalers: [] as string[],
  })

  const isAddressesLoading =
    adminLoading || appLoading || moderatorsLoading || creatorsLoading || distributorsLoading || signalersLoading

  const form = useForm<AdminAppForm>({
    defaultValues: {
      moderators: [],
      creators: [],
      adminAddress: "",
      teamWalletAddress: "",
      distributors: [],
      signalers: [],
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
      signalers: [...(signalers || [])],
    }
    onchainAddresses.current = newOnchainAddresses
    // Resetting the form with the most updated values onchain
    form.reset(newOnchainAddresses)
  }, [admin, app?.teamWalletAddress, creators, distributors, form, moderators, signalers])

  useEffect(() => {
    if (!isAddressesLoading && admin && app?.teamWalletAddress) {
      syncForm()
    }
  }, [admin, app?.teamWalletAddress, syncForm, moderators, creators, distributors, signalers, isAddressesLoading])

  const [adminAddress, teamWalletAddress, newModerators, newDistributors, newCreators, newSignalers] = form.watch([
    "adminAddress",
    "teamWalletAddress",
    "moderators",
    "distributors",
    "creators",
    "signalers",
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
  const isSignalersChanged = haveAddressesChanged(onchainAddresses.current.signalers, newSignalers)

  const hasUnsavedChanges =
    isAdminAddressChanged ||
    isTeamWalletAddressChanged ||
    isModeratorsChanged ||
    isDistributorsChanged ||
    isCreatorsChanged ||
    isSignalersChanged
  const disableSaveButton = !hasUnsavedChanges

  const handleSuccess = useCallback(() => {
    // After successful transaction, update the reference with form values
    onchainAddresses.current = {
      adminAddress: adminAddress,
      moderators: [...newModerators],
      creators: [...newCreators],
      distributors: [...newDistributors],
      signalers: [...newSignalers],
      teamWalletAddress: teamWalletAddress,
    }
  }, [adminAddress, newModerators, newCreators, newDistributors, newSignalers, teamWalletAddress])

  const updateMutation = useUpdateAppAdminInfo({
    appId: app?.id || "",
    onSuccess: handleSuccess,
  })

  const goBack = useCallback(() => {
    router.push(`/apps/${app?.id}`)
    form.reset()
  }, [app?.id, form, router])

  const onSubmit = useCallback(
    (data: AdminAppForm) => {
      const moderatorsToBeAdded = getAddressesToAdd(data.moderators, onchainAddresses.current.moderators)
      const moderatorsToBeRemoved = getAddressesToRemove(onchainAddresses.current.moderators, data.moderators)

      const distributorsToBeAdded = getAddressesToAdd(data.distributors, onchainAddresses.current.distributors)
      const distributorsToBeRemoved = getAddressesToRemove(onchainAddresses.current.distributors, data.distributors)

      const creatorsToBeAdded = getAddressesToAdd(data.creators, onchainAddresses.current.creators)
      const creatorsToBeRemoved = getAddressesToRemove(onchainAddresses.current.creators, data.creators)

      const signalersToBeAdded = getAddressesToAdd(data.signalers, onchainAddresses.current.signalers)
      const signalersToBeRemoved = getAddressesToRemove(onchainAddresses.current.signalers, data.signalers)

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
        signalersToBeAdded,
        signalersToBeRemoved,
      })
    },
    [updateMutation, app?.id, isAdminAddressChanged, isTeamWalletAddressChanged],
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
          <EditAppSignalers form={form} />
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
  )
}

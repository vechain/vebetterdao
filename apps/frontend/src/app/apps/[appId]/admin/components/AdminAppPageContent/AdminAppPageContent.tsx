import { Button, Card, Separator, HStack, Heading, VStack, useDisclosure } from "@chakra-ui/react"
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
import { useCallback, useEffect, useMemo, useRef } from "react"
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

  const { admin } = useCurrentAppAdmin()
  const { moderators } = useCurrentAppModerators()
  const { creators } = useCurrentAppCreators()
  const { distributors } = useCurrentAppRewardDistributors()
  const { activeSignalers: signalers } = useCurrentAppSignalers()
  const { app } = useCurrentAppInfo()
  const { appMetadata } = useCurrentAppMetadata()

  const updateConfirmationModal = useDisclosure()

  const onChainAddresses: AdminAppForm = useMemo(
    () => ({
      moderators: [...(moderators || [])],
      creators: [...(creators || [])],
      adminAddress: admin || "",
      teamWalletAddress: app?.teamWalletAddress || "",
      distributors: [...(distributors || [])],
      signalers: [...(signalers || [])],
    }),
    [moderators, creators, admin, app?.teamWalletAddress, distributors, signalers],
  )

  const onChainAddressesRef = useRef(onChainAddresses)

  useEffect(() => {
    onChainAddressesRef.current = onChainAddresses
  }, [onChainAddresses])

  const form = useForm<AdminAppForm>({
    defaultValues: onChainAddresses,
  })

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
  const isAdminAddressChanged = !compareAddresses(onChainAddressesRef.current.adminAddress, adminAddress)
  const isTeamWalletAddressChanged = !compareAddresses(onChainAddressesRef.current.teamWalletAddress, teamWalletAddress)
  const isModeratorsChanged = haveAddressesChanged(onChainAddressesRef.current.moderators, newModerators)
  const isDistributorsChanged = haveAddressesChanged(onChainAddressesRef.current.distributors, newDistributors)
  const isCreatorsChanged = haveAddressesChanged(onChainAddressesRef.current.creators, newCreators)
  const isSignalersChanged = haveAddressesChanged(onChainAddressesRef.current.signalers, newSignalers)

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
    onChainAddressesRef.current = {
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
      const moderatorsToBeAdded = getAddressesToAdd(data.moderators, onChainAddressesRef.current.moderators)
      const moderatorsToBeRemoved = getAddressesToRemove(onChainAddressesRef.current.moderators, data.moderators)

      const distributorsToBeAdded = getAddressesToAdd(data.distributors, onChainAddressesRef.current.distributors)
      const distributorsToBeRemoved = getAddressesToRemove(onChainAddressesRef.current.distributors, data.distributors)

      const creatorsToBeAdded = getAddressesToAdd(data.creators, onChainAddressesRef.current.creators)
      const creatorsToBeRemoved = getAddressesToRemove(onChainAddressesRef.current.creators, data.creators)

      const signalersToBeAdded = getAddressesToAdd(data.signalers, onChainAddressesRef.current.signalers)
      const signalersToBeRemoved = getAddressesToRemove(onChainAddressesRef.current.signalers, data.signalers)

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
    <Card.Root variant="primary" w="full">
      <Card.Body>
        <VStack gap="48px" align="stretch" as="form" onSubmit={form.handleSubmit(checkAddresses)}>
          <Heading size="4xl">{t("{{app}} settings", { app: appMetadata?.name })}</Heading>
          <EditAppCreatorNFT form={form} />
          <Separator />
          <EditAppModerators form={form} />
          <Separator />
          <EditAppSignalers form={form} />
          <Separator />
          <EditAppAddresses form={form} />
          <EditAppRewardDistributors form={form} />
          <HStack justify={"space-between"} mt={8}>
            <Button variant="secondary" onClick={goBack}>
              {t("Go back")}
            </Button>
            <Button variant="primary" type="submit" disabled={disableSaveButton}>
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
      </Card.Body>
    </Card.Root>
  )
}

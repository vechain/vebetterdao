import { Button, Card, CardBody, Divider, HStack, Heading, VStack, useDisclosure } from "@chakra-ui/react"
import { useCurrentAppAdmin, useCurrentAppMetadata, useCurrentAppModerators } from "../../../hooks"
import { useTranslation } from "react-i18next"
import { EditAppModerators } from "./components/EditAppModerators"
import { EditAppAddresses } from "./components/EditAppAddresses"
import { useForm } from "react-hook-form"
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { UpdateConfirmationModal } from "./components/UpdateConfirmationModal"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"

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

  const form = useForm<AdminAppForm>({
    defaultValues: {
      moderators,
      adminAddress: admin || "",
      teamWalletAddress: app?.teamWalletAddress || "",
    },
  })
  const [adminAddress, teamWalletAddress] = form.watch(["adminAddress", "teamWalletAddress"])

  const isAdminAddressChanged = !compareAddresses(adminAddress, admin || "")

  const isTeamWalletAddressChanged = !compareAddresses(teamWalletAddress, app?.teamWalletAddress || "")

  const router = useRouter()

  const goBack = useCallback(() => {
    router.back()
    form.reset()
  }, [form, router])

  const onSubmit = useCallback((data: AdminAppForm) => {
    console.log(data)
  }, [])

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

  return (
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
            <Button variant="primaryAction" type="submit">
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

import { Button, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { UilPen } from "@iconscout/react-unicons"
import { useCallback, useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useCurrentAppInfo } from "@/app/apps/[appId]/hooks/useCurrentAppInfo"

import { WalletAddressInput } from "../../../../../../../components/Input/WalletAddressInput"
import { useCurrentAppAdmin } from "../../../../../hooks/useCurrentAppAdmin"
import { AdminAppForm } from "../../AdminAppPageContent"

import { ModalEditAdminAddress } from "./components/ModalEditAdminAddress"
import { ModalEditTeamWalletAddress } from "./components/ModalEditTeamWalletAddress"

type Props = { form: UseFormReturn<AdminAppForm> }
export const EditAppAddresses = ({ form }: Props) => {
  const { t } = useTranslation()
  const { admin } = useCurrentAppAdmin()
  const { app } = useCurrentAppInfo()
  const [editAdminAddress, setEditAdminAddress] = useState(false)
  const [editTeamWalletAddress, setEditTeamWalletAddress] = useState(false)
  const modalEditAdminAddress = useDisclosure()
  const handleEditAdminAddress = useCallback(() => {
    modalEditAdminAddress.onClose()
    setEditAdminAddress(true)
  }, [modalEditAdminAddress, setEditAdminAddress])
  const modalEditTeamWalletAddress = useDisclosure()
  const handleEditTeamWalletAddress = useCallback(() => {
    modalEditTeamWalletAddress.onClose()
    setEditTeamWalletAddress(true)
  }, [modalEditTeamWalletAddress, setEditTeamWalletAddress])
  const handleTeamWalletAddressResolved = useCallback(
    (address?: string) => {
      form.setValue("teamWalletAddress", address ?? "")
    },
    [form],
  )
  const handleAdminAddressResolved = useCallback(
    (address?: string) => {
      form.setValue("adminAddress", address ?? "")
    },
    [form],
  )
  return (
    <VStack align="stretch" gap="32px">
      <Text color="status.negative.primary" textStyle="2xl" fontWeight="bold">
        {t("Sensitive parameters")}
      </Text>
      <VStack align="stretch">
        <Text textStyle="md" fontWeight={"800"}>
          {t("Treasury address")}
        </Text>
        <Text textStyle="sm">{t("B3TR tokens will be sent to this address when withdrawing allocations.")}</Text>
        <WalletAddressInput
          onAddressResolved={handleTeamWalletAddressResolved}
          disabled={!editTeamWalletAddress}
          required={true}
          defaultValue={app?.teamWalletAddress}
          inputGroupProps={{
            endElementProps: { pr: 0 },
            endElement: editTeamWalletAddress ? null : (
              <Button
                variant="secondary"
                borderColor="border.secondary"
                borderY="1px"
                borderRight="1px"
                onClick={modalEditTeamWalletAddress.onOpen}
                rounded="8px"
                roundedLeft={0}
                fontWeight="semibold">
                <UilPen size="16px" />
                {t("Edit")}
              </Button>
            ),
          }}
        />
      </VStack>
      <VStack align="stretch">
        <Text textStyle="md" fontWeight={"800"}>
          {t("Admin address")}
        </Text>
        <Text textStyle="sm">
          {t(
            "This address has control over the app and can perform sensitive operations, as updating treasury, distributor, and moderators addresses or transfer ownership.",
          )}
        </Text>
        <WalletAddressInput
          onAddressResolved={handleAdminAddressResolved}
          disabled={!editAdminAddress}
          required={true}
          defaultValue={admin}
          inputGroupProps={{
            endElementProps: {
              pr: 0,
            },
            endElement: editAdminAddress ? null : (
              <Button
                variant="secondary"
                borderColor="border.secondary"
                borderY="1px"
                borderRight="1px"
                onClick={modalEditAdminAddress.onOpen}
                rounded="8px"
                roundedLeft={0}
                fontWeight="semibold">
                <UilPen size="16px" />
                {t("Edit")}
              </Button>
            ),
          }}
        />
      </VStack>
      <ModalEditTeamWalletAddress
        handleEditTeamWalletAddress={handleEditTeamWalletAddress}
        {...modalEditTeamWalletAddress}
      />
      <ModalEditAdminAddress handleEditAdminAddress={handleEditAdminAddress} {...modalEditAdminAddress} />
    </VStack>
  )
}

import { Button, FormControl, InputGroup, InputRightElement, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../AdminAppPageContent"
import { useCurrentAppAdmin } from "@/app/apps/[appId]/hooks"
import { useCurrentAppInfo } from "@/app/apps/[appId]/hooks/useCurrentAppInfo"
import { useCallback } from "react"
import { ModalEditTeamWalletAddress } from "./components/ModalEditTeamWalletAddress"
import { UilPen } from "@iconscout/react-unicons"
import { ModalEditAdminAddress } from "./components/ModalEditAdminAddress"
import { WalletAddressInput } from "@/app/components/Input"

type Props = {
  form: UseFormReturn<AdminAppForm>
  editAdminAddress: boolean
  setEditAdminAddress: (value: boolean) => void
  editTeamWalletAddress: boolean
  setEditTeamWalletAddress: (value: boolean) => void
}

export const EditAppAddresses = ({
  form,
  editAdminAddress,
  setEditAdminAddress,
  editTeamWalletAddress,
  setEditTeamWalletAddress,
}: Props) => {
  const { t } = useTranslation()
  const { admin } = useCurrentAppAdmin()
  const { app } = useCurrentAppInfo()

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
      <Text color="#D23F63" fontSize={"24px"} fontWeight={700}>
        {t("Sensitive parameters")}
      </Text>
      <VStack align="stretch">
        <Text fontSize="md" fontWeight={"800"}>
          {t("Treasury address")}
        </Text>
        <Text fontSize="sm">{t("B3TR tokens will be sent to this address when withdrawing allocations.")}</Text>
        <FormControl>
          <InputGroup>
            <WalletAddressInput
              onAddressResolved={handleTeamWalletAddressResolved}
              isDisabled={!editTeamWalletAddress}
              isRequired={true}
              defaultValue={app?.teamWalletAddress}
            />
            {!editTeamWalletAddress && (
              <InputRightElement width="auto">
                <Button
                  variant="primaryGhost"
                  bg="#FFFFFF"
                  borderY="1px solid #f4f6f9"
                  borderRight="1px solid #f4f6f9"
                  borderLeftRadius={0}
                  onClick={modalEditTeamWalletAddress.onOpen}
                  leftIcon={<UilPen size="16px" />}
                  rounded="8px"
                  fontWeight={500}>
                  {t("Edit")}
                </Button>
              </InputRightElement>
            )}
          </InputGroup>
        </FormControl>
      </VStack>
      <VStack align="stretch">
        <Text fontSize="md" fontWeight={"800"}>
          {t("Admin address")}
        </Text>
        <Text fontSize="sm">
          {t(
            "This address has control over the app and can perform sensitive operations, as updating treasury, distributor, and moderators addresses or transfer ownership.",
          )}
        </Text>
        <FormControl>
          <InputGroup>
            <WalletAddressInput
              onAddressResolved={handleAdminAddressResolved}
              isDisabled={!editAdminAddress}
              isRequired={true}
              defaultValue={admin}
            />
            {!editAdminAddress && (
              <InputRightElement width="auto">
                <Button
                  variant="primaryGhost"
                  bg="#FFFFFF"
                  borderY="1px solid #f4f6f9"
                  borderRight="1px solid #f4f6f9"
                  borderLeftRadius={0}
                  onClick={modalEditAdminAddress.onOpen}
                  leftIcon={<UilPen size="16px" />}
                  rounded="8px"
                  fontWeight={500}>
                  {t("Edit")}
                </Button>
              </InputRightElement>
            )}
          </InputGroup>
        </FormControl>
      </VStack>
      <ModalEditTeamWalletAddress
        handleEditTeamWalletAddress={handleEditTeamWalletAddress}
        {...modalEditTeamWalletAddress}
      />
      <ModalEditAdminAddress handleEditAdminAddress={handleEditAdminAddress} {...modalEditAdminAddress} />
    </VStack>
  )
}

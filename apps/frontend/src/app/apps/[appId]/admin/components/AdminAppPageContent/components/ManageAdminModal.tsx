import { Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { WalletAddressInput } from "@/app/components/Input/WalletAddressInput"
import { useUpdateAdminAddress } from "@/hooks/xApp/useUpdateAdminAddress"

import { BaseModal } from "../../../../../../../components/BaseModal"
import { useCurrentAppAdmin } from "../../../../hooks/useCurrentAppAdmin"
import { useCurrentAppInfo } from "../../../../hooks/useCurrentAppInfo"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const ManageAdminModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { admin } = useCurrentAppAdmin()
  const { sendTransaction } = useUpdateAdminAddress(app?.id || "")
  const [newAddress, setNewAddress] = useState("")

  const handleSubmit = useCallback(() => {
    if (!newAddress) return
    sendTransaction({ address: newAddress })
    setNewAddress("")
  }, [newAddress, sendTransaction])

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton>
      <VStack align="stretch" gap={6}>
        <VStack align="stretch" gap={2}>
          <Heading size="2xl">{t("Admin address")}</Heading>
          <Text color="text.subtle" textStyle="sm">
            {t(
              "This address has control over the app and can perform sensitive operations, as updating treasury, distributor, and moderators addresses or transfer ownership.",
            )}
          </Text>
        </VStack>

        <VStack align="stretch" gap={2}>
          <Text textStyle="sm" fontWeight="semibold">
            {t("Current admin")}
          </Text>
          <Text textStyle="sm" color="text.subtle" wordBreak="break-all">
            {admin}
          </Text>
        </VStack>

        <VStack align="stretch" gap={2}>
          <Text textStyle="sm" fontWeight="semibold">
            {t("New admin address")}
          </Text>
          <WalletAddressInput onAddressResolved={(address: string | undefined) => setNewAddress(address ?? "")} />
        </VStack>

        <HStack rounded="xl" bg="status.negative.subtle" p={4} color="status.negative.primary" gap={3}>
          <UilInfoCircle size="24px" />
          <Text textStyle="sm" fontWeight="semibold">
            {t("You will not be able to manage the app anymore. This action is irreversible.")}
          </Text>
        </HStack>

        <Button variant="outline" colorPalette="red" disabled={!newAddress} onClick={handleSubmit}>
          {t("Transfer admin ownership")}
        </Button>
      </VStack>
    </BaseModal>
  )
}

import { Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { WalletAddressInput } from "@/app/components/Input/WalletAddressInput"
import { useUpdateTreasuryAddress } from "@/hooks/xApp/useUpdateTreasuryAddress"

import { BaseModal } from "../../../../../../../components/BaseModal"
import { useCurrentAppInfo } from "../../../../hooks/useCurrentAppInfo"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const ManageTreasuryModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { sendTransaction } = useUpdateTreasuryAddress(app?.id || "")
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
          <Heading size="2xl">{t("Treasury address")}</Heading>
          <Text color="text.subtle" textStyle="sm">
            {t("B3TR tokens will be sent to this address when withdrawing allocations.")}
          </Text>
        </VStack>

        <VStack align="stretch" gap={2}>
          <Text textStyle="sm" fontWeight="semibold">
            {t("Current address")}
          </Text>
          <Text textStyle="sm" color="text.subtle" wordBreak="break-all">
            {app?.teamWalletAddress}
          </Text>
        </VStack>

        <VStack align="stretch" gap={2}>
          <Text textStyle="sm" fontWeight="semibold">
            {t("New address")}
          </Text>
          <WalletAddressInput onAddressResolved={(address: string | undefined) => setNewAddress(address ?? "")} />
        </VStack>

        <HStack rounded="xl" bg="status.negative.subtle" p={4} color="status.negative.primary" gap={3}>
          <UilInfoCircle size="24px" />
          <Text textStyle="sm">
            {t("Changing the treasury address will redirect all future allocation withdrawals to the new address.")}
          </Text>
        </HStack>

        <Button variant="primary" disabled={!newAddress} onClick={handleSubmit}>
          {t("Update treasury address")}
        </Button>
      </VStack>
    </BaseModal>
  )
}

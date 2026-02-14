import { Heading, Separator, Text, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useManageSignalers } from "@/hooks/xApp/useManageSignalers"

import { BaseModal } from "../../../../../../../components/BaseModal"
import { useCurrentAppInfo } from "../../../../hooks/useCurrentAppInfo"
import { useCurrentAppSignalers } from "../../../../hooks/useCurrentAppSignalers"

import { AddAddressForm } from "./AddAddressForm"
import { AddressListItem } from "./AddressListItem"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const ManageSignalersModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { activeSignalers: signalers } = useCurrentAppSignalers()
  const { sendTransaction } = useManageSignalers(app?.id || "")

  const handleAdd = useCallback(
    (address: string) => {
      sendTransaction({ action: "add", address })
    },
    [sendTransaction],
  )

  const handleRemove = useCallback(
    (address: string) => {
      sendTransaction({ action: "remove", address })
    },
    [sendTransaction],
  )

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton>
      <VStack align="stretch" gap={6}>
        <VStack align="stretch" gap={2}>
          <Heading size="2xl">{t("Signalers")}</Heading>
          <Text color="text.subtle" textStyle="sm">
            {t("These users will have the ability to bot-signal and reset signal counts for individual users.")}
          </Text>
        </VStack>

        {signalers.length > 0 ? (
          <VStack align="stretch" gap={3}>
            {signalers.map(signaler => (
              <AddressListItem key={signaler} address={signaler} onRemove={() => handleRemove(signaler)} />
            ))}
          </VStack>
        ) : (
          <Text color="text.subtle" textStyle="sm">
            {t("No signalers added")}
          </Text>
        )}

        <Separator />

        <AddAddressForm
          onAdd={handleAdd}
          existingAddresses={signalers}
          duplicateMessage={t("Signaler already present")}
          buttonLabel={t("Add signaler")}
          maxCount={3}
          maxCountMessage={t("Max 3 signalers")}
        />
      </VStack>
    </BaseModal>
  )
}

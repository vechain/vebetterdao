import { Heading, Separator, Text, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useManageModerators } from "@/hooks/xApp/useManageModerators"

import { BaseModal } from "../../../../../../../components/BaseModal"
import { useCurrentAppInfo } from "../../../../hooks/useCurrentAppInfo"
import { useCurrentAppModerators } from "../../../../hooks/useCurrentAppModerators"

import { AddAddressForm } from "./AddAddressForm"
import { AddressListItem } from "./AddressListItem"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const ManageModeratorsModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { moderators } = useCurrentAppModerators()
  const { sendTransaction } = useManageModerators(app?.id || "")

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
          <Heading size="2xl">{t("Moderators")}</Heading>
          <Text color="text.subtle" textStyle="sm">
            {t(
              "These users will be able to manage the information in the feed and update the visual data on the profile.",
            )}
          </Text>
        </VStack>

        {moderators.length > 0 ? (
          <VStack align="stretch" gap={3}>
            {moderators.map(moderator => (
              <AddressListItem key={moderator} address={moderator} onRemove={() => handleRemove(moderator)} />
            ))}
          </VStack>
        ) : (
          <Text color="text.subtle" textStyle="sm">
            {t("No moderators added")}
          </Text>
        )}

        <Separator />

        <AddAddressForm
          onAdd={handleAdd}
          existingAddresses={moderators}
          duplicateMessage={t("Moderator already present")}
          buttonLabel={t("Add moderator")}
          maxCount={3}
          maxCountMessage={t("Max 3 moderators")}
        />
      </VStack>
    </BaseModal>
  )
}

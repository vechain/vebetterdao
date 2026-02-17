import { Heading, Separator, Text, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useManageCreators } from "@/hooks/xApp/useManageCreators"

import { BaseModal } from "../../../../../../../components/BaseModal"
import { useCurrentAppCreators } from "../../../../hooks/useCurrentAppCreators"
import { useCurrentAppInfo } from "../../../../hooks/useCurrentAppInfo"

import { AddAddressForm } from "./AddAddressForm"
import { AddressListItem } from "./AddressListItem"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const ManageCreatorsModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { creators } = useCurrentAppCreators()
  const { sendTransaction } = useManageCreators(app?.id || "")

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
          <Heading size="2xl">{t("Creator NFT")}</Heading>
          <Text color="text.subtle" textStyle="sm">
            {t(
              "These users will be able to join the Discord channels, participate in the endorsement phases, and submit new apps.",
            )}
          </Text>
        </VStack>

        {creators.length > 0 ? (
          <VStack align="stretch" gap={3}>
            {creators.map(creator => (
              <AddressListItem key={creator} address={creator} onRemove={() => handleRemove(creator)} />
            ))}
          </VStack>
        ) : (
          <Text color="text.subtle" textStyle="sm">
            {t("No creators added")}
          </Text>
        )}

        <Separator />

        <AddAddressForm
          onAdd={handleAdd}
          existingAddresses={creators}
          duplicateMessage={t("Creator NFT already present")}
          buttonLabel={t("Add creator")}
          maxCount={3}
          maxCountMessage={t("Max 3 creators")}
        />
      </VStack>
    </BaseModal>
  )
}

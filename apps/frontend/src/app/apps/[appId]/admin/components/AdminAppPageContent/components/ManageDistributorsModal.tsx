import { Heading, Separator, Text, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useManageDistributors } from "@/hooks/xApp/useManageDistributors"

import { BaseModal } from "../../../../../../../components/BaseModal"
import { useCurrentAppInfo } from "../../../../hooks/useCurrentAppInfo"
import { useCurrentAppRewardDistributors } from "../../../../hooks/useCurrentAppRewardDistributors"

import { AddAddressForm } from "./AddAddressForm"
import { AddressListItem } from "./AddressListItem"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const ManageDistributorsModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { distributors } = useCurrentAppRewardDistributors()
  const { sendTransaction } = useManageDistributors(app?.id || "")

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
          <Heading size="2xl">{t("Reward Distributors")}</Heading>
          <Text color="text.subtle" textStyle="sm">
            {t(
              "These addresses will be able to distribute rewards to users using your app balance and withdraw funds from the app.",
            )}
          </Text>
        </VStack>

        {distributors.length > 0 ? (
          <VStack align="stretch" gap={3}>
            {distributors.map(distributor => (
              <AddressListItem key={distributor} address={distributor} onRemove={() => handleRemove(distributor)} />
            ))}
          </VStack>
        ) : (
          <Text color="text.subtle" textStyle="sm">
            {t("No distributors added")}
          </Text>
        )}

        <Separator />

        <AddAddressForm
          onAdd={handleAdd}
          existingAddresses={distributors}
          duplicateMessage={t("Rewards distributor already present")}
          buttonLabel={t("Add distributor")}
        />
      </VStack>
    </BaseModal>
  )
}

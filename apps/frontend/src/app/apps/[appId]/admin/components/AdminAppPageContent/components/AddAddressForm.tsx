import { Button, Field, HStack, Text, VStack } from "@chakra-ui/react"
import { UilPlus } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { WalletAddressInput } from "@/app/components/Input/WalletAddressInput"

type Props = {
  onAdd: (address: string) => void
  existingAddresses: readonly string[]
  duplicateMessage: string
  buttonLabel: string
  maxCount?: number
  maxCountMessage?: string
  isAdding?: boolean
}

export const AddAddressForm = ({
  onAdd,
  existingAddresses,
  duplicateMessage,
  buttonLabel,
  maxCount,
  maxCountMessage,
  isAdding,
}: Props) => {
  const { t } = useTranslation()
  const [resolvedAddress, setResolvedAddress] = useState("")
  const { handleSubmit, formState, reset } = useForm()
  const { isValid } = formState
  const { data: vnsData } = useVechainDomain(resolvedAddress)
  const domain = vnsData?.domain

  const isMaxReached = maxCount !== undefined && existingAddresses.length >= maxCount

  const handleAdd = useCallback(() => {
    if (!resolvedAddress) return
    onAdd(resolvedAddress)
    setResolvedAddress("")
    reset()
  }, [resolvedAddress, onAdd, reset])

  if (isMaxReached) {
    return (
      <Text textStyle="sm" color="text.subtle">
        {maxCountMessage || t("Maximum limit reached")}
      </Text>
    )
  }

  return (
    <VStack align="stretch" gap={3}>
      <HStack justify="space-between">
        <Text textStyle="sm">{t("Wallet address")}</Text>
        {domain && (
          <Text textStyle="sm" fontWeight="semibold">
            {"@"}
            {domain}
          </Text>
        )}
      </HStack>
      <Field.Root required invalid={!isValid}>
        <WalletAddressInput
          onAddressResolved={(address: string | undefined) => setResolvedAddress(address ?? "")}
          customValidation={({ address }: { address?: string }) => {
            if (!address) return "Invalid address"
            return existingAddresses.some(existing => compareAddresses(existing, address)) ? duplicateMessage : ""
          }}
        />
      </Field.Root>
      <Button
        variant="primary"
        disabled={!resolvedAddress || isAdding}
        loading={isAdding}
        onClick={handleSubmit(handleAdd)}>
        <UilPlus size="14px" />
        {buttonLabel}
      </Button>
    </VStack>
  )
}

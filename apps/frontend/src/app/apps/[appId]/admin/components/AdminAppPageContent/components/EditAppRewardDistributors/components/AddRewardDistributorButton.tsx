import { CustomModalContent } from "@/components"
import { Button, Field, HStack, Heading, Dialog, Text, VStack, useDisclosure, Icon } from "@chakra-ui/react"
import { UilFileContract, UilPlus } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useCallback } from "react"
import { useForm, UseFormSetValue, UseFormGetValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../../AdminAppPageContent"
import { WalletAddressInput } from "@/app/components/Input"

type Props = {
  getValues: UseFormGetValues<AdminAppForm>
  setValue: UseFormSetValue<AdminAppForm>
}

export const AddRewardDistributorButton = ({ getValues, setValue }: Props) => {
  const { t } = useTranslation()
  const { open: isOpen, onClose, onOpen } = useDisclosure()
  const {
    watch,
    setValue: setAddressFormValue,
    reset: resetAddressForm,
    handleSubmit: handleAddressFormSubmit,
  } = useForm<{
    distributorAddress: string
    distributorDomain: string
  }>()

  const distributorAddress = watch("distributorAddress")
  const distributorDomain = watch("distributorDomain")

  const handleAddressResolved = useCallback(
    (address?: string) => {
      setAddressFormValue("distributorAddress", address ?? "")
    },
    [setAddressFormValue],
  )

  const handleDomainResolved = useCallback(
    (domain?: string) => {
      setAddressFormValue("distributorDomain", domain ?? "")
    },
    [setAddressFormValue],
  )

  const onSubmit = useCallback(
    (data: { distributorAddress: string }) => {
      setValue("distributors", [...getValues("distributors"), data.distributorAddress])
      resetAddressForm()
      onClose()
    },
    [getValues, onClose, resetAddressForm, setValue],
  )

  const getExistingDistributors = useCallback(() => {
    return getValues("distributors")
  }, [getValues])

  const handleClose = useCallback(() => {
    resetAddressForm()
    onClose()
  }, [resetAddressForm, onClose])

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && handleClose()}>
      <CustomModalContent>
        <Dialog.Body p={"40px"}>
          <VStack align="stretch" gap="32px">
            <Icon color="logo" boxSize={14}>
              <UilFileContract />
            </Icon>
            <Heading size="3xl">{t("Add a new reward distributor")}</Heading>
            <VStack align="stretch">
              <HStack justify={"space-between"}>
                <Text textStyle="sm">{t("Contract or wallet address")}</Text>
                {distributorDomain && (
                  <Text textStyle="sm" fontWeight="semibold">
                    {"@"}
                    {distributorDomain}
                  </Text>
                )}
              </HStack>

              <Field.Root required invalid={!distributorAddress}>
                <WalletAddressInput
                  onAddressResolved={handleAddressResolved}
                  onDomainResolved={handleDomainResolved}
                  customValidation={({ address }) => {
                    if (!address) return "Invalid address"
                    return getExistingDistributors().some(distributor => compareAddresses(distributor, address))
                      ? t("Rewards distributor already present")
                      : ""
                  }}
                />
              </Field.Root>
            </VStack>
            <VStack align="stretch">
              <Button
                variant="primary"
                disabled={!distributorAddress}
                type="submit"
                onClick={handleAddressFormSubmit(onSubmit)}>
                {t("Add distributor")}
              </Button>
              <Button variant="ghost" color="actions.tertiary.default" onClick={handleClose}>
                {t("Cancel")}
              </Button>
            </VStack>
          </VStack>
        </Dialog.Body>
      </CustomModalContent>
      <Dialog.Trigger asChild>
        <Button mt={4} onClick={onOpen} variant="ghost" color="actions.tertiary.default" alignSelf={"flex-start"}>
          <UilPlus size="14px" />
          {t("Add distributor")}
        </Button>
      </Dialog.Trigger>
    </Dialog.Root>
  )
}

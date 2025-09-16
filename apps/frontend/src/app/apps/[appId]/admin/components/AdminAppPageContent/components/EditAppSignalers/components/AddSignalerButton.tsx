import { CustomModalContent } from "@/components"
import { Button, Field, HStack, Heading, Dialog, Text, VStack, useDisclosure, CloseButton } from "@chakra-ui/react"
import { UilPlus, UilUser } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useCallback } from "react"
import { UseFormReturn, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../../AdminAppPageContent"
import { useVechainDomain } from "@vechain/vechain-kit"
import { WalletAddressInput } from "@/app/components/Input"

type Props = {
  editAdminForm: UseFormReturn<AdminAppForm>
}

export const AddSignalerButton = ({ editAdminForm }: Props) => {
  const { t } = useTranslation()
  const { open: isOpen, onClose, onOpen } = useDisclosure()
  const addressForm = useForm<{ signalerAddress: string }>()
  const { setValue, watch } = addressForm
  const signalerAddress = watch("signalerAddress")
  const { data: vnsData } = useVechainDomain(signalerAddress)
  const domain = vnsData?.domain
  const onSubmit = useCallback(
    (data: { signalerAddress: string }) => {
      editAdminForm.setValue("signalers", [...editAdminForm.getValues("signalers"), data.signalerAddress])
      addressForm.reset()
      onClose()
    },
    [addressForm, editAdminForm, onClose],
  )

  const handleClose = useCallback(() => {
    addressForm.reset()
    onClose()
  }, [addressForm, onClose])

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={details => !details.open && handleClose()}>
        <CustomModalContent>
          <Dialog.CloseTrigger asChild>
            <CloseButton />
          </Dialog.CloseTrigger>
          <Dialog.Body p={"40px"}>
            <VStack align="stretch" gap="32px">
              <UilUser size="54px" color="actions.tertiary.default" />
              <Heading size="3xl">{t("Add a new signaler")}</Heading>
              <VStack align="stretch">
                <HStack justify={"space-between"}>
                  <Text textStyle="sm">{t("User wallet address")}</Text>
                  {domain && (
                    <Text textStyle="sm" fontWeight="semibold">
                      {"@"}
                      {domain}
                    </Text>
                  )}
                </HStack>
                <Field.Root required invalid={!signalerAddress}>
                  <WalletAddressInput
                    onAddressResolved={address => setValue("signalerAddress", address ?? "")}
                    customValidation={({ address }) => {
                      if (!address) return "Invalid address"
                      return editAdminForm.getValues("signalers").some(signaler => compareAddresses(signaler, address))
                        ? t("Signaler already present")
                        : ""
                    }}
                  />
                </Field.Root>
              </VStack>
              <VStack align="stretch">
                <Button
                  disabled={!signalerAddress}
                  variant="primary"
                  type="submit"
                  onClick={addressForm.handleSubmit(onSubmit)}>
                  {t("Add signaler")}
                </Button>
                <Button variant="ghost" color="actions.tertiary.default" onClick={onClose}>
                  {t("Cancel")}
                </Button>
              </VStack>
            </VStack>
          </Dialog.Body>
        </CustomModalContent>
      </Dialog.Root>
      <Button
        mt={4}
        onClick={onOpen}
        variant="ghost"
        color="actions.tertiary.default"
        disabled={editAdminForm.getValues("signalers").length >= 3}
        alignSelf={"flex-start"}>
        <UilPlus size="14px" />
        {editAdminForm.getValues("signalers").length >= 3 ? t("Max 3 signalers") : t("Add signaler")}
      </Button>
    </>
  )
}

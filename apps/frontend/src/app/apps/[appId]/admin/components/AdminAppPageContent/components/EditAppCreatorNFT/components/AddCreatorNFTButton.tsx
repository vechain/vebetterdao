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
export const AddCreatorNFTButton = ({ editAdminForm }: Props) => {
  const { t } = useTranslation()
  const { open: isOpen, onClose, onOpen } = useDisclosure()
  const addressForm = useForm<{ creatorAddress: string }>()
  const { watch, setValue, handleSubmit, formState } = addressForm

  const creatorAddress = watch("creatorAddress")
  const { isValid } = formState

  const { data: vnsData } = useVechainDomain(creatorAddress)
  const domain = vnsData?.domain

  const onSubmit = useCallback(
    (data: { creatorAddress: string }) => {
      editAdminForm.setValue("creators", [...editAdminForm.getValues("creators"), data.creatorAddress])
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
              <UilUser size="54px" color="#004CFC" />
              <Heading fontSize="28px">{t("Add a new Creator NFT")}</Heading>
              <VStack align="stretch">
                <HStack justify={"space-between"}>
                  <Text fontSize="14px">{t("User wallet address")}</Text>
                  {domain && (
                    <Text fontSize="14px" fontWeight={"600"}>
                      {"@"}
                      {domain}
                    </Text>
                  )}
                </HStack>
                <Field.Root required invalid={!isValid}>
                  <WalletAddressInput
                    onAddressResolved={address => setValue("creatorAddress", address ?? "")}
                    customValidation={({ address }) => {
                      if (!address) return "Invalid address"
                      return editAdminForm.getValues("creators").some(creator => compareAddresses(creator, address))
                        ? t("Creator NFT already present")
                        : ""
                    }}
                  />
                </Field.Root>
              </VStack>
              <VStack align="stretch">
                <Button
                  disabled={!isValid || !creatorAddress}
                  variant="primaryAction"
                  type="submit"
                  onClick={handleSubmit(onSubmit)}>
                  {t("Add creator")}
                </Button>
                <Button variant="primaryGhost" onClick={handleClose}>
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
        variant="primarySubtle"
        disabled={editAdminForm.getValues("creators").length >= 3}
        alignSelf={"flex-start"}>
        <UilPlus size="14px" />
        {editAdminForm.getValues("creators").length >= 3 ? t("Max 3 creators") : t("Add a new Creator NFT")}
      </Button>
    </>
  )
}

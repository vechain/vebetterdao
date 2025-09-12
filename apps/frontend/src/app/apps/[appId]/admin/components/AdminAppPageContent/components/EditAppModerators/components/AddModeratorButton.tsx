import { CustomModalContent } from "@/components"
import {
  Button,
  Field,
  HStack,
  Heading,
  Dialog,
  Text,
  VStack,
  useDisclosure,
  CloseButton,
  Icon,
} from "@chakra-ui/react"
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

export const AddModeratorButton = ({ editAdminForm }: Props) => {
  const { t } = useTranslation()
  const { open: isOpen, onClose, onOpen } = useDisclosure()
  const addressForm = useForm<{ moderatorAddress: string }>()
  const { setValue, watch } = addressForm
  const moderatorAddress = watch("moderatorAddress")
  const { data: vnsData } = useVechainDomain(moderatorAddress)
  const domain = vnsData?.domain
  const onSubmit = useCallback(
    (data: { moderatorAddress: string }) => {
      editAdminForm.setValue("moderators", [...editAdminForm.getValues("moderators"), data.moderatorAddress])
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
          <Dialog.CloseTrigger>
            <CloseButton />
          </Dialog.CloseTrigger>
          <Dialog.Body p={"40px"}>
            <VStack align="stretch" gap="32px">
              <Icon color="logo" boxSize={14}>
                <UilUser />
              </Icon>
              <Heading size="3xl">{t("Add a new moderator")}</Heading>
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
                <Field.Root required invalid={!moderatorAddress}>
                  <WalletAddressInput
                    onAddressResolved={address => setValue("moderatorAddress", address ?? "")}
                    customValidation={({ address }) => {
                      if (!address) return "Invalid address"
                      return editAdminForm
                        .getValues("moderators")
                        .some(moderator => compareAddresses(moderator, address))
                        ? t("Moderator already present")
                        : ""
                    }}
                  />
                </Field.Root>
              </VStack>
              <VStack align="stretch">
                <Button
                  disabled={!moderatorAddress}
                  variant="primary"
                  type="submit"
                  onClick={addressForm.handleSubmit(onSubmit)}>
                  {t("Add moderator")}
                </Button>
                <Button variant="primaryGhost" onClick={onClose}>
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
        disabled={editAdminForm.getValues("moderators").length >= 3}
        alignSelf={"flex-start"}>
        <UilPlus size="14px" />
        {editAdminForm.getValues("moderators").length >= 3 ? t("Max 3 moderators") : t("Add moderator")}
      </Button>
    </>
  )
}

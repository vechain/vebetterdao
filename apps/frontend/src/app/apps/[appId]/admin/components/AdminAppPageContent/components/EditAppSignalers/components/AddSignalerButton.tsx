import { CustomModalContent } from "@/components"
import {
  Button,
  FormControl,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
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

export const AddSignalerButton = ({ editAdminForm }: Props) => {
  const { t } = useTranslation()
  const { isOpen, onClose, onOpen } = useDisclosure()
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
      <Modal isOpen={isOpen} onClose={handleClose} trapFocus={false}>
        <ModalOverlay />
        <CustomModalContent>
          <ModalCloseButton />
          <ModalBody p={"40px"}>
            <VStack align="stretch" gap="32px">
              <UilUser size="54px" color="#004CFC" />
              <Heading fontSize="28px">{t("Add a new signaler")}</Heading>
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
                <FormControl isRequired isInvalid={!signalerAddress}>
                  <WalletAddressInput
                    onAddressResolved={address => setValue("signalerAddress", address ?? "")}
                    customValidation={({ address }) => {
                      if (!address) return "Invalid address"
                      return editAdminForm.getValues("signalers").some(signaler => compareAddresses(signaler, address))
                        ? t("Signaler already present")
                        : ""
                    }}
                  />
                </FormControl>
              </VStack>
              <VStack align="stretch">
                <Button
                  isDisabled={!signalerAddress}
                  variant="primaryAction"
                  type="submit"
                  onClick={addressForm.handleSubmit(onSubmit)}>
                  {t("Add signaler")}
                </Button>
                <Button variant="primaryGhost" onClick={onClose}>
                  {t("Cancel")}
                </Button>
              </VStack>
            </VStack>
          </ModalBody>
        </CustomModalContent>
      </Modal>
      <Button
        mt={4}
        onClick={onOpen}
        variant="primarySubtle"
        isDisabled={editAdminForm.getValues("signalers").length >= 3}
        leftIcon={<UilPlus size="14px" />}
        alignSelf={"flex-start"}>
        {editAdminForm.getValues("signalers").length >= 3 ? t("Max 3 signalers") : t("Add signaler")}
      </Button>
    </>
  )
}

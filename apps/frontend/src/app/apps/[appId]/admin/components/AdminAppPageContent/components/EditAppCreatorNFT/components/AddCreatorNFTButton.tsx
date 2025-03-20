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
export const AddCreatorNFTButton = ({ editAdminForm }: Props) => {
  const { t } = useTranslation()
  const { isOpen, onClose, onOpen } = useDisclosure()
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
      <Modal isOpen={isOpen} onClose={handleClose} trapFocus={false}>
        <ModalOverlay />
        <CustomModalContent>
          <ModalCloseButton />
          <ModalBody p={"40px"}>
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
                <FormControl isRequired isInvalid={!isValid}>
                  <WalletAddressInput
                    onAddressResolved={address => setValue("creatorAddress", address ?? "")}
                    customValidation={({ address }) => {
                      if (!address) return "Invalid address"
                      return editAdminForm.getValues("creators").some(creator => compareAddresses(creator, address))
                        ? t("Creator NFT already present")
                        : ""
                    }}
                  />
                </FormControl>
              </VStack>
              <VStack align="stretch">
                <Button
                  isDisabled={!isValid || !creatorAddress}
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
          </ModalBody>
        </CustomModalContent>
      </Modal>
      <Button
        mt={4}
        onClick={onOpen}
        variant="primarySubtle"
        leftIcon={<UilPlus size="14px" />}
        isDisabled={editAdminForm.getValues("creators").length >= 3}
        alignSelf={"flex-start"}>
        {editAdminForm.getValues("creators").length >= 3 ? t("Max 3 creators") : t("Add a new Creator NFT")}
      </Button>
    </>
  )
}

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
import { UilFileContract, UilPlus } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useCallback } from "react"
import { UseFormReturn, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../../AdminAppPageContent"
import { useVechainDomain } from "@vechain/dapp-kit-react"
import { WalletAddressInput } from "@/app/components/Input"

type Props = {
  editAdminForm: UseFormReturn<AdminAppForm>
}

export const AddRewardDistributorButton = ({ editAdminForm }: Props) => {
  const { t } = useTranslation()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const addressForm = useForm<{ distributorAddress: string }>()
  const { watch, setValue } = addressForm
  const distributorAddress = watch("distributorAddress")
  const { domain } = useVechainDomain({ addressOrDomain: distributorAddress })

  const onSubmit = useCallback(
    (data: { distributorAddress: string }) => {
      editAdminForm.setValue("distributors", [...editAdminForm.getValues("distributors"), data.distributorAddress])
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
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <CustomModalContent>
          <ModalCloseButton />
          <ModalBody p={"40px"}>
            <VStack align="stretch" gap="32px">
              <UilFileContract size="54px" color="#004CFC" />
              <Heading fontSize="28px">{t("Add a new reward distributor")}</Heading>
              <VStack align="stretch">
                <HStack justify={"space-between"}>
                  <Text fontSize="14px">{t("Contract or wallet address")}</Text>
                  {domain && (
                    <Text fontSize="14px" fontWeight={"600"}>
                      {"@"}
                      {domain}
                    </Text>
                  )}
                </HStack>

                <FormControl isRequired isInvalid={!distributorAddress}>
                  <WalletAddressInput
                    onAddressResolved={address => setValue("distributorAddress", address ?? "")}
                    customValidation={({ address }) => {
                      if (!address) return "Invalid address"
                      return editAdminForm
                        .getValues("distributors")
                        .some(distributor => compareAddresses(distributor, address))
                        ? t("Rewards distributor already present")
                        : ""
                    }}
                  />
                </FormControl>
              </VStack>
              <VStack align="stretch">
                <Button
                  variant="primaryAction"
                  isDisabled={!distributorAddress}
                  type="submit"
                  onClick={addressForm.handleSubmit(onSubmit)}>
                  {t("Add distributor")}
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
        leftIcon={<UilPlus size="14px" />}
        alignSelf={"flex-start"}>
        {t("Add distributor")}
      </Button>
    </>
  )
}

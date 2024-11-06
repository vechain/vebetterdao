import { CustomModalContent } from "@/components"
import {
  Button,
  FormControl,
  FormErrorMessage,
  HStack,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { UilFileContract, UilPlus } from "@iconscout/react-unicons"
import { compareAddresses, isValid } from "@repo/utils/AddressUtils"
import { useCallback } from "react"
import { UseFormReturn, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../../AdminAppPageContent"
import { useWalletName } from "@vechain.energy/dapp-kit-hooks"

type Props = {
  editAdminForm: UseFormReturn<AdminAppForm>
}

export const AddRewardDistributorButton = ({ editAdminForm }: Props) => {
  const { t } = useTranslation()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const addressForm = useForm<{ distributorAddress: string }>()
  const {
    formState: { errors },
  } = addressForm
  const { name } = useWalletName(addressForm.watch("distributorAddress"))

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
                  {name && (
                    <Text fontSize="14px" fontWeight={"600"}>
                      {"@"}
                      {name}
                    </Text>
                  )}
                </HStack>
                <FormControl isInvalid={!!errors.distributorAddress}>
                  <Input
                    {...addressForm.register("distributorAddress", {
                      required: {
                        value: true,
                        message: t("Address required"),
                      },
                      validate: {
                        validAddress: value => isValid(value) || t("Invalid address"),
                        alreadyPresent: value =>
                          !editAdminForm
                            .getValues("distributors")
                            .some(distributor => compareAddresses(distributor, value)) ||
                          t("Rewards distributor already present"),
                      },
                    })}></Input>
                  <FormErrorMessage>{errors.distributorAddress?.message}</FormErrorMessage>
                </FormControl>
              </VStack>
              <VStack align="stretch">
                <Button variant="primaryAction" type="submit" onClick={addressForm.handleSubmit(onSubmit)}>
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

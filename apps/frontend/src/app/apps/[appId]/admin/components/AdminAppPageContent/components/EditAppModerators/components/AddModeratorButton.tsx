import { CustomModalContent } from "@/components"
import {
  Button,
  FormControl,
  FormErrorMessage,
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
import { UilPlus, UilUser } from "@iconscout/react-unicons"
import { compareAddresses, isValid } from "@repo/utils/AddressUtils"
import { useCallback } from "react"
import { UseFormReturn, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../../AdminAppPageContent"

type Props = {
  editAdminForm: UseFormReturn<AdminAppForm>
}

export const AddModeratorButton = ({ editAdminForm }: Props) => {
  const { t } = useTranslation()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const addressForm = useForm<{ moderatorAddress: string }>()
  const {
    formState: { errors },
  } = addressForm

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
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <CustomModalContent>
          <ModalCloseButton />
          <ModalBody p={"40px"}>
            <VStack align="stretch" gap="32px">
              <UilUser size="54px" color="#004CFC" />
              <Heading fontSize="28px">{t("Add a new moderator")}</Heading>
              <VStack align="stretch">
                <Text fontSize="14px">{t("User wallet address")}</Text>
                <FormControl isInvalid={!!errors.moderatorAddress}>
                  <Input
                    {...addressForm.register("moderatorAddress", {
                      required: {
                        value: true,
                        message: t("Address required"),
                      },
                      validate: {
                        validAddress: value => isValid(value) || t("Invalid address"),
                        alreadyPresent: value =>
                          !editAdminForm
                            .getValues("moderators")
                            .some(moderator => compareAddresses(moderator, value)) || t("Moderator already present"),
                      },
                    })}></Input>
                  <FormErrorMessage>{errors.moderatorAddress?.message}</FormErrorMessage>
                </FormControl>
              </VStack>
              <VStack align="stretch">
                <Button variant="primaryAction" type="submit" onClick={addressForm.handleSubmit(onSubmit)}>
                  {t("Add moderator")}
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
        {t("Add Moderator")}
      </Button>
    </>
  )
}

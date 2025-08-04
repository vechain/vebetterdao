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
  const { isOpen, onClose, onOpen } = useDisclosure()
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
                  {distributorDomain && (
                    <Text fontSize="14px" fontWeight={"600"}>
                      {"@"}
                      {distributorDomain}
                    </Text>
                  )}
                </HStack>

                <FormControl isRequired isInvalid={!distributorAddress}>
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
                </FormControl>
              </VStack>
              <VStack align="stretch">
                <Button
                  variant="primaryAction"
                  isDisabled={!distributorAddress}
                  type="submit"
                  onClick={handleAddressFormSubmit(onSubmit)}>
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

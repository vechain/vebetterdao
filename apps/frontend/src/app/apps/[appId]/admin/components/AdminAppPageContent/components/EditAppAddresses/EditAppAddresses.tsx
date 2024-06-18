import {
  Button,
  FormControl,
  FormErrorMessage,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../AdminAppPageContent"
import { useCurrentAppAdmin } from "@/app/apps/[appId]/hooks"
import { useCurrentAppInfo } from "@/app/apps/[appId]/hooks/useCurrentAppInfo"
import { isValid } from "@repo/utils/AddressUtils"
import { useCallback } from "react"
import { ModalEditTeamWalletAddress } from "./components/ModalEditTeamWalletAddress"
import { UilPen } from "@iconscout/react-unicons"
import { ModalEditAdminAddress } from "./components/ModalEditAdminAddress"

type Props = {
  form: UseFormReturn<AdminAppForm>
  editAdminAddress: boolean
  setEditAdminAddress: (value: boolean) => void
  editTeamWalletAddress: boolean
  setEditTeamWalletAddress: (value: boolean) => void
}

export const EditAppAddresses = ({
  form,
  editAdminAddress,
  setEditAdminAddress,
  editTeamWalletAddress,
  setEditTeamWalletAddress,
}: Props) => {
  const { t } = useTranslation()
  const { admin } = useCurrentAppAdmin()
  const { app } = useCurrentAppInfo()
  const { errors } = form.formState

  const modalEditAdminAddress = useDisclosure()
  const handleEditAdminAddress = useCallback(() => {
    modalEditAdminAddress.onClose()
    setEditAdminAddress(true)
  }, [modalEditAdminAddress, setEditAdminAddress])

  const modalEditTeamWalletAddress = useDisclosure()
  const handleEditTeamWalletAddress = useCallback(() => {
    modalEditTeamWalletAddress.onClose()
    setEditTeamWalletAddress(true)
  }, [modalEditTeamWalletAddress, setEditTeamWalletAddress])

  return (
    <VStack align="stretch" gap="32px">
      <Text color="#D23F63" fontSize={"24px"} fontWeight={700}>
        {t("Sensitive parameters")}
      </Text>
      <VStack align="stretch">
        <Text fontSize="14px">{t("Allocation team address")}</Text>
        <FormControl isInvalid={!!errors.teamWalletAddress}>
          <InputGroup>
            <Input
              {...form.register("teamWalletAddress", {
                required: {
                  value: true,
                  message: t("Address required"),
                },
                validate: value => isValid(value) || t("Invalid address"),
              })}
              isDisabled={!editTeamWalletAddress}
              defaultValue={app?.teamWalletAddress}></Input>
            {!editTeamWalletAddress && (
              <InputRightElement width="auto">
                <Button
                  variant="primaryGhost"
                  onClick={modalEditTeamWalletAddress.onOpen}
                  leftIcon={<UilPen size="16px" />}
                  rounded="8px"
                  fontWeight={500}>
                  {t("Edit")}
                </Button>
              </InputRightElement>
            )}
          </InputGroup>
          <FormErrorMessage>{errors.teamWalletAddress?.message}</FormErrorMessage>
        </FormControl>
      </VStack>
      <VStack align="stretch">
        <Text fontSize="14px">{t("Admin address")}</Text>
        <FormControl isInvalid={!!errors.adminAddress}>
          <InputGroup>
            <Input
              {...form.register("adminAddress", {
                required: {
                  value: true,
                  message: t("Address required"),
                },
                validate: value => isValid(value) || t("Invalid address"),
              })}
              isDisabled={!editAdminAddress}
              defaultValue={admin}></Input>
            {!editAdminAddress && (
              <InputRightElement width="auto">
                <Button
                  variant="primaryGhost"
                  onClick={modalEditAdminAddress.onOpen}
                  leftIcon={<UilPen size="16px" />}
                  rounded="8px"
                  fontWeight={500}>
                  {t("Edit")}
                </Button>
              </InputRightElement>
            )}
          </InputGroup>
          <FormErrorMessage>{errors.adminAddress?.message}</FormErrorMessage>
        </FormControl>
      </VStack>
      <ModalEditTeamWalletAddress
        handleEditTeamWalletAddress={handleEditTeamWalletAddress}
        {...modalEditTeamWalletAddress}
      />
      <ModalEditAdminAddress handleEditAdminAddress={handleEditAdminAddress} {...modalEditAdminAddress} />
    </VStack>
  )
}

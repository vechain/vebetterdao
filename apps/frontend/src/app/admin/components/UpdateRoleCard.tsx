import { useForm, Controller } from "react-hook-form"
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Select,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { UilCheckCircle, UilExclamationCircle } from "@iconscout/react-unicons"
import { useMemo, useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useHasRole } from "@/api/contracts/account"
import { useAccessControl } from "@/hooks"
import { CONTRACT_LIST } from "@/constants"
import { useWallet } from "@vechain/dapp-kit-react"
import { TransactionModal } from "@/components"
import { WalletAddressInput } from "@/app/components/Input"

type UpdateRoleCardInput = {
  contract?: string
  role?: string
  walletInput?: string
}

export const UpdateRoleCard = () => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    register,
  } = useForm<UpdateRoleCardInput>({
    defaultValues: {
      contract: "",
      role: "",
      walletInput: "",
    },
  })

  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { account } = useWallet()
  const [walletAddress, setWalletAddress] = useState<string>("")

  const selectedContractAddress = watch("contract")
  const selectedRole = watch("role")

  const selectedContractObject = useMemo(
    () => CONTRACT_LIST.find(contract => compareAddresses(contract.contractAddress, selectedContractAddress)),
    [selectedContractAddress],
  )

  const { data: userAlreadyHasRole, error: hasRoleError } = useHasRole(
    selectedRole ?? "",
    selectedContractAddress ?? "",
    walletAddress,
  )

  const { grantRole, renounceRole, revokeRole } = useAccessControl({
    contractAddress: selectedContractAddress ?? "",
    walletAddress: walletAddress ?? "",
    role: selectedRole ?? "",
    onSuccess: () => {
      accessControlAction.resetStatus()
      onClose()
    },
  })
  const isFormValid =
    !errors.contract &&
    !errors.role &&
    !errors.walletInput &&
    !!selectedContractAddress &&
    !!selectedRole &&
    !!walletAddress &&
    !!account

  const accessControlAction = useMemo(() => {
    if (userAlreadyHasRole && compareAddresses(account ?? "", walletAddress)) {
      return renounceRole
    }

    if (!userAlreadyHasRole) {
      return grantRole
    }
    return revokeRole
  }, [userAlreadyHasRole, account, walletAddress, grantRole, renounceRole, revokeRole])

  const handleFormSubmit = (_: any) => {
    accessControlAction.sendTransaction()
    onOpen()
  }
  const handleClose = useCallback(() => {
    accessControlAction.resetStatus()
    onClose()
  }, [accessControlAction, onClose])

  useEffect(() => {
    setValue("role", "") // Reset role when contract changes
  }, [selectedContractAddress, account, setValue])

  return (
    <>
      <Card w={"full"}>
        <CardHeader>
          <Heading size="lg">{t("Update Address Role")}</Heading>
          <Text fontSize="sm">{t("Grant or revoke a role to a wallet address on a smart contract")}</Text>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <VStack spacing={4} alignItems={"start"}>
              <FormControl isInvalid={!!errors.contract} isRequired>
                <FormLabel>{t("Select Contract")}</FormLabel>
                <Controller
                  name="contract"
                  control={control}
                  rules={{ required: t("This field is required") }}
                  render={({ field }) => (
                    <Select {...field} placeholder={t("Select Contract")}>
                      {CONTRACT_LIST.map(contract => (
                        <option key={contract.contractAddress} value={contract.contractAddress}>
                          {contract.name}
                        </option>
                      ))}
                    </Select>
                  )}
                />
                <FormErrorMessage>{errors.contract?.message}</FormErrorMessage>
              </FormControl>

              {selectedContractAddress && (
                <FormControl isInvalid={!!errors.role} isRequired>
                  <FormLabel>{t("Select Role")}</FormLabel>
                  <Controller
                    name="role"
                    control={control}
                    rules={{ required: t("This field is required") }}
                    render={({ field }) => (
                      <Select {...field} placeholder={t("Select Role")}>
                        {selectedContractObject?.roles.map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                  <FormErrorMessage>{errors.role?.message}</FormErrorMessage>
                </FormControl>
              )}

              <FormControl isInvalid={!!errors.walletInput} isRequired>
                <FormLabel>{t("Wallet Address")}</FormLabel>
                <WalletAddressInput
                  inputName="walletInput"
                  watch={watch}
                  register={register}
                  onAddressResolved={address => setWalletAddress(address ?? "")}
                  placeholder={t("Enter wallet address or domain to grant or revoke role")}
                />

                <FormErrorMessage>{errors.walletInput?.message}</FormErrorMessage>
              </FormControl>

              {isFormValid && !hasRoleError && (
                <VStack w="full" align="stretch" flexWrap="wrap">
                  {userAlreadyHasRole ? (
                    <Badge
                      textTransform="none"
                      fontSize="sm"
                      display="flex"
                      alignItems="center"
                      borderRadius="12px"
                      p={2}
                      colorScheme={"green"}>
                      <HStack>
                        <Icon as={UilCheckCircle} color="green" />
                        <Text>
                          {t("Wallet '{{humanAddress}}' already has '{{selectedRole}}' role", {
                            humanAddress: humanAddress(walletAddress),
                            selectedRole,
                          })}
                        </Text>
                      </HStack>
                    </Badge>
                  ) : (
                    <Badge
                      textTransform="none"
                      fontSize="sm"
                      display="flex"
                      alignItems="center"
                      borderRadius="12px"
                      p={2}
                      colorScheme={"red"}>
                      <HStack>
                        <Icon as={UilExclamationCircle} color="red" />
                        <Text>
                          {t("Wallet '{{humanAddress}}' doesn't have '{{selectedRole}}' role", {
                            humanAddress: humanAddress(walletAddress),
                            selectedRole,
                          })}
                        </Text>
                      </HStack>
                    </Badge>
                  )}
                </VStack>
              )}

              <Button
                isLoading={accessControlAction.isTxReceiptLoading}
                isDisabled={!isFormValid || !!hasRoleError}
                colorScheme={userAlreadyHasRole ? "red" : "green"}
                type="submit">
                {userAlreadyHasRole
                  ? compareAddresses(account ?? "", walletAddress)
                    ? t("Renounce Role")
                    : t("Revoke Role")
                  : t("Grant Role")}
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={accessControlAction.error ? "error" : accessControlAction.status}
        successTitle={t("Wallet address roles updated successfully")}
        onTryAgain={handleSubmit(handleFormSubmit)}
        showTryAgainButton
        showExplorerButton
        txId={accessControlAction.txReceipt?.meta?.txID ?? accessControlAction.sendTransactionTx?.txid}
        pendingTitle={t("Updating wallet address role...")}
        errorTitle={t("Error updating role")}
        errorDescription={accessControlAction.error?.reason}
      />
    </>
  )
}

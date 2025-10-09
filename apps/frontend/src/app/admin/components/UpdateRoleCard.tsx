import { useForm, Controller } from "react-hook-form"
import { Badge, Button, Card, Field, Heading, HStack, Icon, NativeSelect, Text, VStack } from "@chakra-ui/react"
import { UilCheckCircle, UilExclamationCircle } from "@iconscout/react-unicons"
import { useMemo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useHasRole } from "@/api/contracts/account"
import { useAccessControl } from "@/hooks"
import { CONTRACT_LIST } from "@/constants"
import { WalletAddressInput } from "@/app/components/Input"
import { useWallet } from "@vechain/vechain-kit"
type UpdateRoleCardInput = {
  contract?: string
  role?: string
  walletAddress?: string
}

export const UpdateRoleCard = () => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateRoleCardInput>({
    defaultValues: {
      contract: "",
      role: "",
      walletAddress: "",
    },
  })

  const { t } = useTranslation()
  const { account } = useWallet()

  const walletAddress = watch("walletAddress")
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
    },
  })
  const isFormValid =
    !errors.contract &&
    !errors.role &&
    !errors.walletAddress &&
    !!selectedContractAddress &&
    !!selectedRole &&
    !!walletAddress &&
    !!account?.address

  const accessControlAction = useMemo(() => {
    if (userAlreadyHasRole && compareAddresses(account?.address ?? "", walletAddress)) {
      return renounceRole
    }

    if (!userAlreadyHasRole) {
      return grantRole
    }
    return revokeRole
  }, [userAlreadyHasRole, account?.address, walletAddress, grantRole, renounceRole, revokeRole])

  const handleFormSubmit = (_: any) => {
    accessControlAction.sendTransaction()
  }

  useEffect(() => {
    setValue("role", "") // Reset role when contract changes
  }, [selectedContractAddress, account?.address, setValue])

  const getButtonText = () => {
    if (userAlreadyHasRole) {
      return compareAddresses(account?.address ?? "", walletAddress) ? t("Renounce Role") : t("Revoke Role")
    }
    return t("Grant Role")
  }

  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="3xl">{t("Update Address Role")}</Heading>
        <Text textStyle="sm">{t("Grant or revoke a role to a wallet address on a smart contract")}</Text>
      </Card.Header>

      <Card.Body>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <VStack gap={4} alignItems={"start"}>
            <Field.Root required invalid={!!errors.contract}>
              <Field.Label>
                {t("Select Contract")}
                <Field.RequiredIndicator />
              </Field.Label>
              <Controller
                name="contract"
                control={control}
                rules={{ required: t("This field is required") }}
                render={({ field }) => (
                  <NativeSelect.Root>
                    <NativeSelect.Indicator />
                    <NativeSelect.Field {...field} placeholder={t("Select Contract")}>
                      {CONTRACT_LIST.map(contract => (
                        <option key={contract.contractAddress} value={contract.contractAddress}>
                          {contract.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                )}
              />
              <Field.ErrorText>{errors.contract?.message}</Field.ErrorText>
            </Field.Root>

            {selectedContractAddress && (
              <Field.Root invalid={!!errors.role} required>
                <Field.Label>
                  {t("Select Role")}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: t("This field is required") }}
                  render={({ field }) => (
                    <NativeSelect.Root>
                      <NativeSelect.Indicator />
                      <NativeSelect.Field {...field} placeholder={t("Select Role")}>
                        {selectedContractObject?.roles.map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  )}
                />
                <Field.ErrorText>{errors.role?.message}</Field.ErrorText>
              </Field.Root>
            )}

            <Field.Root>
              <Field.Label>{t("Wallet Address")}</Field.Label>
              <WalletAddressInput
                onAddressResolved={address => setValue("walletAddress", address ?? "")}
                placeholder={t("Enter wallet address or domain to grant or revoke role")}
              />
            </Field.Root>

            {isFormValid && !hasRoleError && (
              <VStack w="full" align="stretch" flexWrap="wrap">
                {userAlreadyHasRole ? (
                  <Badge
                    textTransform="none"
                    textStyle="sm"
                    display="flex"
                    alignItems="center"
                    borderRadius="12px"
                    p={2}
                    colorPalette={"green"}>
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
                    textStyle="sm"
                    display="flex"
                    alignItems="center"
                    borderRadius="12px"
                    p={2}
                    colorPalette={"red"}>
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
              loading={accessControlAction.isTransactionPending}
              disabled={!isFormValid || !!hasRoleError}
              colorPalette={userAlreadyHasRole ? "red" : "green"}
              type="submit">
              {getButtonText()}
            </Button>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  )
}

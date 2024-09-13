import { useHasRole } from "@/api/contracts/account"
import { TransactionModal } from "@/components"
import { CONTRACT_LIST } from "@/constants"
import { useAccessControl } from "@/hooks"
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
  Input,
  Select,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { UilCheckCircle, UilExclamationCircle } from "@iconscout/react-unicons"
import { AddressUtils } from "@repo/utils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const UpdateRoleCard = () => {
  const [selectedContractAddress, setSelectedContractAddress] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [newAddressFieldIsDirty, setNewAddressFieldIsDirty] = useState(false)

  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { account } = useWallet()

  const isValidAddress = useMemo(() => {
    //Do not allow empty address or same address as the current wallet
    if (!walletAddress || !account) return false
    if (walletAddress.toLowerCase() === account?.toLowerCase()) return false

    return AddressUtils.isValid(walletAddress)
  }, [walletAddress])

  const isFormValid = useMemo(
    () => selectedContractAddress && selectedRole && isValidAddress,
    [selectedContractAddress, selectedRole, isValidAddress],
  )

  const selectedContractObject = useMemo(
    () => CONTRACT_LIST.find(contract => contract.contractAddress === selectedContractAddress),
    [selectedContractAddress],
  )

  const { data: userAlreadyHasRole } = useHasRole(selectedRole, selectedContractAddress, walletAddress)
  const { grantRole, revokeRole } = useAccessControl({
    contractAddress: selectedContractAddress,
    walletAddress,
    role: selectedRole,
  })

  const accessControlAction = useMemo(() => {
    if (!userAlreadyHasRole) {
      return grantRole
    }
    return revokeRole
  }, [userAlreadyHasRole, grantRole, revokeRole])

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()
      accessControlAction.sendTransaction()
      onOpen()
    },
    [accessControlAction, userAlreadyHasRole, onOpen],
  )

  const handleClose = useCallback(() => {
    accessControlAction.resetStatus()
    onClose()
  }, [accessControlAction, userAlreadyHasRole, onClose])

  const ellipsisAddress = (address: string, startLength = 6, endLength = 4) => {
    if (!address) return ""
    const start = address.slice(0, startLength)
    const end = address.slice(-endLength)
    return `${start}...${end}`
  }

  return (
    <>
      <Card w={"full"}>
        <CardHeader>
          <Heading size="lg">{t("Update Address Role")}</Heading>
          <Text fontSize="sm">{t("Grant or revoke a role to a wallet address on a smart contract")}</Text>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} alignItems={"start"}>
              <FormControl isRequired>
                <FormLabel>{t("Select Contract")}</FormLabel>
                <Select
                  placeholder={t("Select Contract")}
                  onChange={e => {
                    setSelectedContractAddress(e.target.value)
                    setSelectedRole("")
                  }}
                  value={selectedContractAddress}>
                  {CONTRACT_LIST.map(contract => (
                    <option key={contract.contractAddress} value={contract.contractAddress}>
                      {contract.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {selectedContractAddress && (
                <FormControl isRequired>
                  <FormLabel>{t("Select Role")}</FormLabel>
                  <Select
                    placeholder={t("Select Role")}
                    onChange={e => setSelectedRole(e.target.value)}
                    value={selectedRole}>
                    {selectedContractObject?.roles.map(role => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl isRequired isInvalid={!isValidAddress && newAddressFieldIsDirty}>
                <FormLabel>{t("Wallet Address")}</FormLabel>
                <Input
                  placeholder={t("Enter wallet address to grant or revoke role")}
                  value={walletAddress}
                  onChange={e => {
                    setWalletAddress(e.target.value)
                    setNewAddressFieldIsDirty(true)
                  }}
                />
                <FormErrorMessage>{t("Invalid address")}</FormErrorMessage>
              </FormControl>

              {isFormValid ? (
                <HStack w="full">
                  {userAlreadyHasRole ? (
                    <UilCheckCircle size={20} color="green" />
                  ) : (
                    <UilExclamationCircle size={20} color="red" />
                  )}
                  <Badge textTransform={"none"} fontSize={"sm"} colorScheme={userAlreadyHasRole ? "green" : "red"}>
                    {userAlreadyHasRole
                      ? t("Wallet '{{ellipsisAddress}}' already has '{{selectedRole}}' role", {
                          ellipsisAddress: ellipsisAddress(walletAddress),
                          selectedRole,
                        })
                      : t("Wallet '{{ellipsisAddress}}' doesn't have '{{selectedRole}}' role", {
                          ellipsisAddress: ellipsisAddress(walletAddress),
                          selectedRole,
                        })}
                  </Badge>
                </HStack>
              ) : null}

              <Button isDisabled={!isFormValid} colorScheme={userAlreadyHasRole ? "red" : "green"} type="submit">
                {userAlreadyHasRole ? t("Revoke Role") : t("Grant Role")}
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={accessControlAction.error ? "error" : accessControlAction.status}
        successTitle={"Wallet address roles updated successfully"}
        onTryAgain={handleSubmit}
        showTryAgainButton
        showExplorerButton
        txId={accessControlAction.txReceipt?.meta?.txID ?? accessControlAction.sendTransactionTx?.txid}
        pendingTitle={"Updating wallet address role..."}
        errorTitle={"Error updating role"}
        errorDescription={accessControlAction.error?.reason}
      />
    </>
  )
}

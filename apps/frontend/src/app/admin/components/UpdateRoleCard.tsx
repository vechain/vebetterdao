import { useHasRole } from "@/api/contracts/account"
import { TransactionModal } from "@/components"
import { CONTRACT_LIST } from "@/constants"
import { useAccessControl } from "@/hooks"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Select,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
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
    [accessControlAction?.status, userAlreadyHasRole, onOpen],
  )

  const handleClose = useCallback(() => {
    accessControlAction.resetStatus()
    onClose()
  }, [accessControlAction, userAlreadyHasRole, onClose])

  return (
    <>
      <Card w={"full"}>
        <CardHeader>
          <Heading size="lg">{t("Update Address Role")}</Heading>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} alignItems={"start"}>
              <FormControl isRequired>
                <FormLabel>{t("Select Contract")}</FormLabel>
                <Select
                  placeholder={t("Select Contract")}
                  onChange={e => setSelectedContractAddress(e.target.value)}
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

              <Button isDisabled={!isFormValid} colorScheme="blue" type="submit">
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

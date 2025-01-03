import { useUserStatus } from "@/api"
import { TransactionModal } from "@/components"
import { UserStatus, useWhitelistBlacklistUser } from "@/hooks"
import {
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
  InputGroup,
  Select,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const ManageUserStatus = () => {
  const [user, setUser] = useState<string>("")
  const [userFieldIsDirty, setUserFieldIsDirty] = useState<boolean>(false)
  const [actionType, setActionType] = useState(UserStatus.NONE)
  const { isOpen, onClose, onOpen } = useDisclosure()

  const userStatus = useUserStatus(user)

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(user)
  }, [user])

  const { t } = useTranslation()

  const {
    sendTransaction,
    resetStatus,
    isTxReceiptLoading,
    sendTransactionPending,
    status,
    error,
    txReceipt,
    sendTransactionTx,
  } = useWhitelistBlacklistUser({
    address: user,
    currentStatus: userStatus,
    newStatus: actionType,
  })

  const handleSetActionType = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionType(e.target.value as UserStatus)
  }, [])

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()
      sendTransaction(undefined)
      onOpen()
    },
    [sendTransaction, onOpen],
  )

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [resetStatus, onClose])

  const isLoading = isTxReceiptLoading || sendTransactionPending
  const isFormValid = isValidAddress
  let buttonColorScheme: string = "gray"
  if (actionType === UserStatus.WHITELIST) {
    buttonColorScheme = "green"
  } else if (actionType === UserStatus.BLACKLIST) {
    buttonColorScheme = "red"
  }

  let buttonText: string = t("Remove Status")
  if (actionType === UserStatus.WHITELIST) {
    buttonText = t("Whitelist User")
  } else if (actionType === UserStatus.BLACKLIST) {
    buttonText = t("Blacklist User")
  }

  let modalSuccessTitle: string = t("User Status Removed")
  if (actionType === UserStatus.WHITELIST) {
    modalSuccessTitle = t("User Whitelisted")
  } else if (actionType === UserStatus.BLACKLIST) {
    modalSuccessTitle = t("User Blacklisted")
  }

  let modalPendingTitle: string = t("Removing user status...")
  if (actionType === UserStatus.WHITELIST) {
    modalPendingTitle = t("Whitelisting user...")
  } else if (actionType === UserStatus.BLACKLIST) {
    modalPendingTitle = t("Blacklisting user...")
  }

  let modalErrorTitle: string = t("Error removing user status")
  if (actionType === UserStatus.WHITELIST) {
    modalErrorTitle = t("Error whitelisting user")
  } else if (actionType === UserStatus.BLACKLIST) {
    modalErrorTitle = t("Error blacklisting user")
  }

  return (
    <>
      <Card w={"full"}>
        <CardHeader>
          <Heading size="lg">{t("Manage User Status")}</Heading>
          <Text fontSize="sm">
            {t("Manage user participation by adding them to a whitelist, blacklist, or removing their status")}
          </Text>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} alignItems={"start"}>
              <HStack spacing={4} alignItems={"start"} w={"full"}>
                <FormControl isRequired isInvalid={!isValidAddress && userFieldIsDirty}>
                  <FormLabel>
                    <strong>{t("User address")}</strong>
                  </FormLabel>
                  <InputGroup>
                    <Input
                      placeholder={t("Enter the user address")}
                      value={user}
                      onChange={e => {
                        setUser(e.target.value)
                        setUserFieldIsDirty(true)
                      }}
                      disabled={isLoading}
                    />
                  </InputGroup>
                  <FormErrorMessage>{t("Address not valid")}</FormErrorMessage>
                </FormControl>
              </HStack>

              <HStack spacing={4} alignItems="center" w="full">
                <FormLabel>
                  <strong>{t("Action")}</strong>
                </FormLabel>
                <Select
                  value={actionType}
                  onChange={handleSetActionType}
                  isDisabled={isLoading}
                  placeholder={t("Select action")}>
                  <option value={UserStatus.WHITELIST}>{t(UserStatus.WHITELIST as any)}</option>
                  <option value={UserStatus.BLACKLIST}>{t(UserStatus.BLACKLIST as any)}</option>
                  <option value={UserStatus.NONE}>{t(UserStatus.NONE as any)}</option>
                </Select>
              </HStack>

              <Button
                isDisabled={!isFormValid || actionType === userStatus}
                colorScheme={buttonColorScheme}
                type="submit"
                isLoading={isLoading}>
                {buttonText}
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={error ? "error" : status}
        successTitle={modalSuccessTitle}
        onTryAgain={handleSubmit}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        pendingTitle={modalPendingTitle}
        errorTitle={modalErrorTitle}
        errorDescription={error?.reason}
      />
    </>
  )
}

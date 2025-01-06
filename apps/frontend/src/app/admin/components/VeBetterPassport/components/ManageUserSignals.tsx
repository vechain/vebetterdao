import { useUserBotSignals } from "@/api"
import { TransactionModal } from "@/components"
import { useResetUserBotSignals, useSignalBotUser } from "@/hooks"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  InputGroup,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const ManageUserSignals = () => {
  const [user, setUser] = useState<string>("")
  const [userFieldIsDirty, setUserFieldIsDirty] = useState<boolean>(false)
  const [reason, setReason] = useState<string>("")
  const { isOpen, onClose, onOpen } = useDisclosure()

  const { data: signals, isLoading: signalsLoading } = useUserBotSignals(user)

  const {
    sendTransaction: resetSignalsTransaction,
    resetStatus: resetSignalsStatus,
    isTxReceiptLoading: isResetTxLoading,
    sendTransactionPending: isResetPending,
    status: resetStatus,
    error: resetError,
    txReceipt: resetTxReceipt,
    sendTransactionTx: resetTxTransaction,
  } = useResetUserBotSignals({
    address: user,
    reason,
  })

  const {
    sendTransaction: signalUserTransaction,
    resetStatus: signalUserStatus,
    isTxReceiptLoading: isSignalTxLoading,
    sendTransactionPending: isSignalPending,
    status: signalStatus,
    error: signalError,
    txReceipt: signalTxReceipt,
    sendTransactionTx: signalTxTransaction,
  } = useSignalBotUser({
    address: user,
    reason,
  })

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(user)
  }, [user])

  const { t } = useTranslation()

  const handleResetSignalsSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()
      resetSignalsTransaction(undefined)
      onOpen()
    },
    [resetSignalsTransaction, onOpen],
  )

  const handleSignalUserSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()
      signalUserTransaction(undefined)
      onOpen()
    },
    [signalUserTransaction, onOpen],
  )

  const handleClose = useCallback(() => {
    resetSignalsStatus()
    signalUserStatus()
    onClose()
  }, [resetSignalsStatus, signalUserStatus, onClose])

  const isFormValid = isValidAddress && reason.trim() !== ""
  const isSignalResetEnabled = signals > 0
  const isLoading = isResetTxLoading || isSignalTxLoading || isResetPending || isSignalPending

  let successTitle = "Action Completed"
  if (resetStatus === "success") {
    successTitle = "Signals Reset"
  } else if (signalStatus === "success") {
    successTitle = "User Signaled"
  }

  let pendingTitle = "Processing action..."
  if (resetStatus === "pending") {
    pendingTitle = "Resetting signals..."
  } else if (signalStatus === "pending") {
    pendingTitle = "Signaling user..."
  }

  let errorTitle = "Error processing action"
  if (resetError) {
    errorTitle = "Error resetting signals"
  } else if (signalError) {
    errorTitle = "Error signaling user"
  }

  return (
    <>
      <Card w={"full"}>
        <CardHeader>
          <Heading size="lg">{t("Manage User Signals")}</Heading>
          <Text fontSize="sm">
            {t(
              "You can either reset the signals of a user or signal them. Please provide a reason and choose the appropriate action.",
            )}
          </Text>
        </CardHeader>
        <CardBody>
          <form>
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
                      disabled={signalsLoading || isLoading}
                    />
                  </InputGroup>
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>
                  <strong>{t("Reason")}</strong>
                </FormLabel>
                <InputGroup>
                  <Input
                    placeholder={t("Enter the reason for the action")}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    disabled={isLoading}
                  />
                </InputGroup>
              </FormControl>

              {!signalsLoading && (
                <Text>
                  {t("Current Signals")} {signals}
                </Text>
              )}

              <HStack spacing={4}>
                {isSignalResetEnabled && (
                  <Button
                    isDisabled={!isFormValid}
                    colorScheme="red"
                    onClick={handleResetSignalsSubmit}
                    isLoading={isResetTxLoading || isResetPending}>
                    {t("Reset Signals")}
                  </Button>
                )}

                <Button
                  isDisabled={!isFormValid}
                  colorScheme="blue"
                  onClick={handleSignalUserSubmit}
                  isLoading={isSignalTxLoading || isSignalPending}>
                  {t("Signal User")}
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={resetError || signalError ? "error" : resetStatus || signalStatus}
        successTitle={successTitle}
        onTryAgain={resetStatus === "error" ? handleResetSignalsSubmit : handleSignalUserSubmit}
        showTryAgainButton
        showExplorerButton
        txId={
          resetTxReceipt?.meta.txID ??
          signalTxReceipt?.meta.txID ??
          resetTxTransaction?.txid ??
          signalTxTransaction?.txid
        }
        pendingTitle={pendingTitle}
        errorTitle={errorTitle}
        errorDescription={resetError?.reason || signalError?.reason}
      />
    </>
  )
}

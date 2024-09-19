import { TogglePassportCheck, useIsPassportCheckEnabled } from "@/api/contracts/veBetterPassport"
import { TransactionModal } from "@/components"
import { TogglePassportFunction, useTogglePassportCheck } from "@/hooks"
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  SimpleGrid,
  Switch,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { useCallback } from "react"

export const PassportToggles = () => {
  const { data: isWhiteListCheckEnabled } = useIsPassportCheckEnabled("whitelistCheckEnabled")
  const { data: isBlackListCheckEnabled } = useIsPassportCheckEnabled("blacklistCheckEnabled")
  const { data: isSignalingCheckEnabled } = useIsPassportCheckEnabled("signalingCheckEnabled")
  const { data: isParticipationScoreCheckEnabled } = useIsPassportCheckEnabled("participationScoreCheckEnabled")
  const { data: isNodeOwnershipCheckEnabled } = useIsPassportCheckEnabled("nodeOwnershipCheckEnabled")
  const { data: isGMOwnershipCheckEnabled } = useIsPassportCheckEnabled("gmOwnershipCheckEnabled")

  return (
    <Card>
      <CardHeader>
        <Heading size="lg">{"Passport checks enabled"}</Heading>
      </CardHeader>
      <CardBody>
        <FormControl as={SimpleGrid} gap={3}>
          <PassportCheck
            name={"Whitelist Check"}
            isEnabled={isWhiteListCheckEnabled === true}
            toggleFunction={"toggleWhitelistCheck"}
            checkFunction={"whitelistCheckEnabled"}
          />
          <PassportCheck
            name={"Blacklist Check"}
            isEnabled={isBlackListCheckEnabled === true}
            toggleFunction={"toggleBlacklistCheck"}
            checkFunction={"blacklistCheckEnabled"}
          />
          <PassportCheck
            name={"Signaling Check"}
            isEnabled={isSignalingCheckEnabled === true}
            toggleFunction={"toggleSignalingCheck"}
            checkFunction={"signalingCheckEnabled"}
          />
          <PassportCheck
            name={"Participation Score Check"}
            isEnabled={isParticipationScoreCheckEnabled === true}
            toggleFunction={"toggleParticipationScoreCheck"}
            checkFunction={"participationScoreCheckEnabled"}
          />
          <PassportCheck
            name={"Node Ownership Check"}
            isEnabled={isNodeOwnershipCheckEnabled === true}
            toggleFunction={"toggleNodeOwnershipCheck"}
            checkFunction={"nodeOwnershipCheckEnabled"}
          />
          <PassportCheck
            name={"GM Ownership Check"}
            isEnabled={isGMOwnershipCheckEnabled === true}
            toggleFunction={"toggleGMOwnershipCheck"}
            checkFunction={"gmOwnershipCheckEnabled"}
          />
        </FormControl>
      </CardBody>
    </Card>
  )
}

type PassportCheckProps = {
  name: string
  isEnabled: boolean
  toggleFunction: TogglePassportFunction
  checkFunction: TogglePassportCheck
}

const PassportCheck = ({ name, isEnabled, toggleFunction, checkFunction }: PassportCheckProps) => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  const {
    sendTransaction,
    resetStatus,
    isTxReceiptLoading,
    sendTransactionPending,
    status,
    error,
    txReceipt,
    sendTransactionTx,
  } = useTogglePassportCheck({
    toggleFunction,
    checkFunction,
  })

  const handleToggle = useCallback(
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

  return (
    <VStack>
      <HStack w={"full"} justifyContent={"space-between"}>
        <FormLabel>{name}</FormLabel>
        <Switch
          isChecked={isEnabled}
          onChange={event => handleToggle(event)}
          disabled={isTxReceiptLoading || sendTransactionPending}
        />
      </HStack>
      <Divider />
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={error ? "error" : status}
        successTitle={isEnabled ? `${name} is now active` : `${name} is not deactivated`}
        onTryAgain={handleToggle}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        pendingTitle={isEnabled ? `Enabling ${name}...` : `Disabling ${name}...`}
        errorTitle={"Error toggling check"}
        errorDescription={error?.reason}
      />
    </VStack>
  )
}

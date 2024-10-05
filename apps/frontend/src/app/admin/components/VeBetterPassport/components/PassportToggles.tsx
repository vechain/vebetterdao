import { usePassportChecks } from "@/api"
import { TransactionModal } from "@/components"
import { TogglePassportCheck } from "@/constants"
import { useTogglePassportCheck } from "@/hooks"
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
  const {
    isWhiteListCheckEnabled,
    isBlackListCheckEnabled,
    isSignalingCheckEnabled,
    isParticipationScoreCheckEnabled,
    isGMOwnershipCheckEnabled,
  } = usePassportChecks()

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
            checkToToggle={TogglePassportCheck.WhitelistCheck}
          />
          <PassportCheck
            name={"Blacklist Check"}
            isEnabled={isBlackListCheckEnabled === true}
            checkToToggle={TogglePassportCheck.BlacklistCheck}
          />
          <PassportCheck
            name={"Signaling Check"}
            isEnabled={isSignalingCheckEnabled === true}
            checkToToggle={TogglePassportCheck.SignalingCheck}
          />
          <PassportCheck
            name={"Participation Score Check"}
            isEnabled={isParticipationScoreCheckEnabled === true}
            checkToToggle={TogglePassportCheck.ParticipationScoreCheck}
          />
          <PassportCheck
            name={"GM Ownership Check"}
            isEnabled={isGMOwnershipCheckEnabled === true}
            checkToToggle={TogglePassportCheck.GmOwnershipCheck}
          />
        </FormControl>
      </CardBody>
    </Card>
  )
}

type PassportCheckProps = {
  name: string
  isEnabled: boolean
  checkToToggle: TogglePassportCheck
}

const PassportCheck = ({ name, isEnabled, checkToToggle }: PassportCheckProps) => {
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
    checkToToggle,
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
        successTitle={isEnabled ? `${name} is now active` : `${name} is now deactivated`}
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

import { useUserBotSignals } from "@/api"
import { WalletAddressInput } from "@/app/components/Input"
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
  VStack,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const ManageUserSignals = () => {
  const [user, setUser] = useState<string>("")
  const [reason, setReason] = useState<string>("")

  const { data: signals, isLoading: signalsLoading } = useUserBotSignals(user)

  const {
    sendTransaction: resetSignalsTransaction,
    isTransactionPending: isResetTxLoading,
    status: resetStatus,
  } = useResetUserBotSignals({
    address: user,
    reason,
  })
  const isResetPending = resetStatus === "pending"

  const {
    sendTransaction: signalUserTransaction,
    isTransactionPending: isSignalTxLoading,
    status: signalStatus,
  } = useSignalBotUser({
    address: user,
    reason,
  })
  const isSignalPending = signalStatus === "pending"

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(user)
  }, [user])

  const { t } = useTranslation()

  const handleResetSignalsSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()
      resetSignalsTransaction(undefined)
    },
    [resetSignalsTransaction],
  )

  const handleSignalUserSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()
      signalUserTransaction(undefined)
    },
    [signalUserTransaction],
  )

  const isFormValid = isValidAddress && reason.trim() !== ""
  const isSignalResetEnabled = signals > 0
  const isLoading = isResetTxLoading || isSignalTxLoading || isResetPending || isSignalPending

  return (
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
              <FormControl isRequired isInvalid={!isValidAddress}>
                <FormLabel>
                  <strong>{t("User address")}</strong>
                </FormLabel>
                <InputGroup>
                  <WalletAddressInput
                    placeholder={t("Enter the user address")}
                    isDisabled={signalsLoading || isLoading}
                    onAddressResolved={address => setUser(address ?? "")}
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
  )
}

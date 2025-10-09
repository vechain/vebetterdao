import { useUserBotSignals } from "@/api"
import { WalletAddressInput } from "@/app/components/Input"
import { useResetUserBotSignals, useSignalBotUser } from "@/hooks"
import { Button, Card, Field, Heading, HStack, Input, InputGroup, Text, VStack } from "@chakra-ui/react"
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
  const isSignalResetEnabled = signals ? Number(signals) > 0 : false
  const isLoading = isResetTxLoading || isSignalTxLoading || isResetPending || isSignalPending

  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="3xl">{t("Manage User Signals")}</Heading>
        <Text textStyle="sm">
          {t(
            "You can either reset the signals of a user or signal them. Please provide a reason and choose the appropriate action.",
          )}
        </Text>
      </Card.Header>
      <Card.Body>
        <form>
          <VStack gap={4} alignItems={"start"}>
            <HStack gap={4} alignItems={"start"} w={"full"}>
              <Field.Root required invalid={!isValidAddress}>
                <Field.Label>
                  <strong>{t("User address")}</strong>
                  <Field.RequiredIndicator />
                </Field.Label>
                <InputGroup>
                  <WalletAddressInput
                    placeholder={t("Enter the user address")}
                    disabled={signalsLoading || isLoading}
                    onAddressResolved={address => setUser(address ?? "")}
                  />
                </InputGroup>
              </Field.Root>
            </HStack>

            <Field.Root required>
              <Field.Label>
                <strong>{t("Reason")}</strong>
                <Field.RequiredIndicator />
              </Field.Label>
              <InputGroup>
                <Input
                  placeholder={t("Enter the reason for the action")}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  disabled={isLoading}
                />
              </InputGroup>
            </Field.Root>

            {!signalsLoading && (
              <Text>
                {t("Current Signals")} {signals}
              </Text>
            )}

            <HStack gap={4}>
              {isSignalResetEnabled && (
                <Button
                  disabled={!isFormValid}
                  colorPalette="red"
                  onClick={handleResetSignalsSubmit}
                  loading={isResetTxLoading || isResetPending}>
                  {t("Reset Signals")}
                </Button>
              )}

              <Button
                disabled={!isFormValid}
                colorPalette="blue"
                onClick={handleSignalUserSubmit}
                loading={isSignalTxLoading || isSignalPending}>
                {t("Signal User")}
              </Button>
            </HStack>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  )
}

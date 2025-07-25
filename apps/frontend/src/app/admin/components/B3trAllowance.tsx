import { useB3trAllowance } from "@/api"
import { useB3trApprove, useGetB3trBalance } from "@/hooks"
import { VStack, HStack, Button, Field, InputGroup, Input, NumberInput, Card, Heading, Text } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { WalletAddressInput } from "@/app/components/Input"

export const B3trAllowance = () => {
  const { account } = useWallet()
  const { data: b3trBalance } = useGetB3trBalance(account?.address ?? undefined)
  const [amount, setAmount] = useState<string>("0")
  const [spender, setSpender] = useState<string>("")
  const [amountFieldIsDirty, setAmountFieldIsDirty] = useState<boolean>(false)
  const { t } = useTranslation()

  const { data: allowedAmount, isLoading: allowedAmountLoading } = useB3trAllowance(
    account?.address ?? undefined,
    spender,
  )
  const allowedAmountScaled = useMemo(() => {
    return allowedAmount?.scaled ?? "0"
  }, [allowedAmount])

  const { sendTransaction, isTransactionPending, status } = useB3trApprove({
    spender: spender ?? "",
    amount: amount ?? 0,
  })

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(spender)
  }, [spender])

  const isAmountValid = useMemo(() => {
    if (b3trBalance === undefined) return false

    return parseInt(amount) <= parseInt(b3trBalance?.scaled)
  }, [amount, b3trBalance])

  const isFormValid = useMemo(() => isValidAddress && isAmountValid, [isValidAddress, isAmountValid])

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()

      if (!isValidAddress) return
      sendTransaction()
    },
    [sendTransaction, isValidAddress],
  )

  const isLoading = isTransactionPending || status === "pending"

  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="lg">{t("B3TR Token Allowance")}</Heading>
        <Text fontSize="sm">{t("Allow an external address to spend your B3TR tokens.")}</Text>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit}>
          <VStack gap={4} alignItems={"start"}>
            <HStack gap={4} alignItems={"start"} w={"full"}>
              <Field.Root>
                <Field.Label>
                  <strong>{t("Balance")}</strong>
                </Field.Label>
                <InputGroup
                  endElement={
                    <Text
                      pointerEvents="none"
                      pl={1}
                      pr={1}
                      ml={0}
                      backgroundColor={"transparent"}
                      borderColor={"inherit"}
                      borderLeft={"none"}>
                      {t("B3TR")}
                    </Text>
                  }>
                  <Input value={b3trBalance?.scaled} disabled={true} />
                </InputGroup>
              </Field.Root>
            </HStack>

            <HStack gap={4} alignItems={"start"} w={"full"}>
              <Field.Root required>
                <Field.Label>
                  <strong>{t("Spender")}</strong>
                  <Field.RequiredIndicator />
                </Field.Label>
                <InputGroup>
                  <WalletAddressInput
                    onAddressResolved={address => setSpender(address ?? "")}
                    placeholder={t("Who should be able to use the tokens?")}
                  />
                </InputGroup>
                <Field.ErrorText>{t("Address not valid")}</Field.ErrorText>
              </Field.Root>
            </HStack>

            <HStack gap={4} w={"full"} justify={"space-between"} align={"start"}>
              <Field.Root required invalid={!isAmountValid && amountFieldIsDirty} w={"full"}>
                <Field.Label>
                  <strong>{t("Amount to allow")}</strong>
                  <Field.RequiredIndicator />
                </Field.Label>
                <NumberInput.Root
                  min={0}
                  value={allowedAmountLoading ? t("Loading...") : amount}
                  disabled={isLoading}
                  onValueChange={e => {
                    setAmount(e.value)
                    setAmountFieldIsDirty(true)
                  }}>
                  <NumberInput.Input />
                  <NumberInput.Control />
                </NumberInput.Root>
                <Field.ErrorText>{t("Invalid amount")}</Field.ErrorText>
              </Field.Root>

              <Field.Root w={"full"}>
                <Field.Label>
                  <strong>{t("Current allowance")}</strong>
                </Field.Label>
                <InputGroup
                  endElement={
                    <Text
                      pointerEvents="none"
                      pl={1}
                      pr={1}
                      ml={0}
                      backgroundColor={"transparent"}
                      borderColor={"inherit"}
                      borderLeft={"none"}>
                      {t("B3TR")}
                    </Text>
                  }>
                  <Input
                    placeholder={t("Amount of tokens the inserted address is already allowed to spend")}
                    value={allowedAmountScaled}
                    disabled={true}
                  />
                </InputGroup>
              </Field.Root>
            </HStack>
            <Button disabled={!isFormValid} colorPalette="blue" type="submit" loading={isLoading}>
              {t("Allow")}
            </Button>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  )
}

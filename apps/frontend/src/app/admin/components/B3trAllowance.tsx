import { useB3trAllowance } from "@/api"
import { useB3trApprove } from "@/hooks"
import {
  VStack,
  HStack,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberIncrementStepper,
  NumberInputStepper,
  NumberDecrementStepper,
  InputRightAddon,
  Card,
  CardHeader,
  Heading,
  CardBody,
  Text,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useGetB3trBalance, useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { WalletAddressInput } from "@/app/components/Input"

export const B3trAllowance = () => {
  const { account } = useWallet()
  const { data: b3trBalance } = useGetB3trBalance(account?.address ?? undefined)
  const [amount, setAmount] = useState<number>(0)
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

    return amount <= parseInt(b3trBalance?.scaled)
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
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">{t("B3TR Token Allowance")}</Heading>
        <Text fontSize="sm">{t("Allow an external address to spend your B3TR tokens.")}</Text>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} alignItems={"start"}>
            <HStack spacing={4} alignItems={"start"}>
              <FormControl>
                <FormLabel>
                  <strong>{t("Balance")}</strong>
                </FormLabel>
                <InputGroup>
                  <Input value={b3trBalance?.scaled} disabled={true} />
                  <InputRightAddon
                    pointerEvents="none"
                    pl={1}
                    pr={1}
                    ml={0}
                    backgroundColor={"transparent"}
                    borderColor={"inherit"}
                    borderLeft={"none"}>
                    {t("B3TR")}
                  </InputRightAddon>
                </InputGroup>
              </FormControl>
            </HStack>

            <HStack spacing={4} alignItems={"start"} w={"full"}>
              <FormControl isRequired>
                <FormLabel>
                  <strong>{t("Spender")}</strong>
                </FormLabel>
                <InputGroup>
                  <WalletAddressInput
                    onAddressResolved={address => setSpender(address ?? "")}
                    placeholder={t("Who should be able to use the tokens?")}
                  />
                </InputGroup>
                <FormErrorMessage>{t("Address not valid")}</FormErrorMessage>
              </FormControl>
            </HStack>

            <HStack spacing={4} w={"full"} justify={"space-between"} align={"start"}>
              <FormControl isRequired isInvalid={!isAmountValid && amountFieldIsDirty} w={"full"}>
                <FormLabel>
                  <strong>{t("Amount to allow")}</strong>
                </FormLabel>
                <NumberInput
                  min={0}
                  value={allowedAmountLoading ? t("Loading...") : amount}
                  isDisabled={isLoading}
                  onChange={value => {
                    setAmount(parseInt(value))
                    setAmountFieldIsDirty(true)
                  }}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{t("Invalid amount")}</FormErrorMessage>
              </FormControl>

              <FormControl w={"full"}>
                <FormLabel>
                  <strong>{t("Current allowance")}</strong>
                </FormLabel>
                <InputGroup>
                  <Input
                    placeholder={t("Amount of tokens the inserted address is already allowed to spend")}
                    value={allowedAmountScaled}
                    disabled={true}
                  />
                  <InputRightAddon
                    pointerEvents="none"
                    pl={1}
                    pr={1}
                    ml={0}
                    backgroundColor={"transparent"}
                    borderColor={"inherit"}
                    borderLeft={"none"}>
                    {t("B3TR")}
                  </InputRightAddon>
                </InputGroup>
              </FormControl>
            </HStack>
            <Button isDisabled={!isFormValid} colorScheme="blue" type="submit" isLoading={isLoading}>
              {t("Allow")}
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}

import { useB3trAllowance, useB3trBalance } from "@/api"
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
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo, useState } from "react"

export const B3trAllowance = () => {
  const { account } = useWallet()
  const { data: b3trBalance } = useB3trBalance(account ?? undefined)

  const [spender, setSpender] = useState<string>("")
  const [amount, setAmount] = useState<number>(0)
  const [spenderFieldIsDirty, setSpenderFieldIsDirty] = useState<boolean>(false)
  const [amountFieldIsDirty, setAmountFieldIsDirty] = useState<boolean>(false)

  const { data: allowedAmount, isLoading: allowedAmountLoading } = useB3trAllowance(account ?? undefined, spender)
  const allowedAmountScaled = useMemo(() => {
    return allowedAmount?.scaled ?? "0"
  }, [allowedAmount])

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useB3trApprove({
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

  const isFormValid = useMemo(() => isValidAddress && isAmountValid, [isValidAddress, amount])

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    sendTransaction(undefined)
  }

  const isLoading = isTxReceiptLoading || sendTransactionPending

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} alignItems={"start"}>
        <HStack spacing={4} alignItems={"start"}>
          <FormControl>
            <FormLabel>
              <strong>{"Balance"}</strong>
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
                B3TR
              </InputRightAddon>
            </InputGroup>
          </FormControl>
        </HStack>

        <HStack spacing={4} alignItems={"start"} w={"full"}>
          <FormControl isRequired isInvalid={!isValidAddress && spenderFieldIsDirty}>
            <FormLabel>
              <strong>{"Spender"}</strong>
            </FormLabel>
            <InputGroup>
              <Input
                placeholder="Who should be able to use the tokens?"
                value={spender}
                onChange={e => {
                  setSpender(e.target.value)
                  setSpenderFieldIsDirty(true)
                }}
                disabled={isLoading}
              />
            </InputGroup>
            <FormErrorMessage>{"Address not valid"}</FormErrorMessage>
          </FormControl>
        </HStack>

        <HStack spacing={4} w={"full"} justify={"space-between"} align={"start"}>
          <FormControl isRequired isInvalid={!isAmountValid && amountFieldIsDirty} w={"full"}>
            <FormLabel>
              <strong>{"Amount to allow"}</strong>
            </FormLabel>
            <NumberInput
              min={0}
              value={allowedAmountLoading ? "Loading..." : amount}
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
            <FormErrorMessage>{"Invalid amount"}</FormErrorMessage>
          </FormControl>

          <FormControl w={"full"}>
            <FormLabel>
              <strong>{"Current allowance"}</strong>
            </FormLabel>
            <InputGroup>
              <Input
                placeholder="Amount of tokens the inserted address is already allowed to spend"
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
                B3TR
              </InputRightAddon>
            </InputGroup>
          </FormControl>
        </HStack>
        <Button isDisabled={!isFormValid} colorScheme="blue" type="submit" isLoading={isLoading}>
          Allow
        </Button>
      </VStack>
    </form>
  )
}

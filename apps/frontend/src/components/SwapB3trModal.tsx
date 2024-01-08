import { useB3trBalance, useB3trTokenDetails } from "@/api"
import { useStakeB3tr } from "@/hooks"
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Modal,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Text,
  FormHelperText,
  Stack,
  HStack,
} from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { SliderWithTooltip } from "./SliderWithTooltip"

type Props = {
  isOpen: boolean
  onClose: () => void
}
type FormData = {
  amount: string
}

export const SwapB3trModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useB3trBalance(account ?? undefined)
  const { data: tokenDetails, isLoading: isTokensDetailsLoading } = useB3trTokenDetails()

  const formattedBalance = useMemo(() => {
    if (!balance) {
      return "0"
    }
    const scaledAmount = FormattingUtils.scaleNumberDown(balance, tokenDetails?.decimals ?? 18)
    return FormattingUtils.humanNumber(scaledAmount, scaledAmount)
  }, [balance])

  const {
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { amount: "0" } })

  const watchPercentageAmount = watch("amount", "0")

  const { formattedAmount, scaledAmount } = useMemo(() => {
    if (!balance) {
      return { formattedAmount: "0", scaledAmount: "0" }
    }

    const parsedPercentageAmount = Number(watchPercentageAmount) / 100
    const balanceToSwap = Number(balance) * parsedPercentageAmount

    const decimals = tokenDetails?.decimals ?? 18

    const scaledAmount = FormattingUtils.scaleNumberDown(balanceToSwap, decimals)
    const formattedAmount = FormattingUtils.humanNumber(scaledAmount, scaledAmount)
    return { formattedAmount, scaledAmount }
  }, [tokenDetails, balance, watchPercentageAmount])

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending, sendTransactionError } = useStakeB3tr({
    amount: scaledAmount,
  })

  const isButtonLoading = isTxReceiptLoading || sendTransactionPending

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <form onSubmit={handleSubmit(() => sendTransaction())}>
        <ModalContent>
          <ModalHeader>Swap B3TR</ModalHeader>

          <ModalCloseButton />
          <ModalBody>
            <Text mb="4" fontSize={"sm"}>
              Swapping B3TR will give you a 1:1 ratio of VOT3 tokens, which can be used to vote on proposals.
            </Text>
            <FormControl>
              <FormLabel>Amount to swap</FormLabel>
              <Controller
                name="amount"
                control={control}
                rules={{
                  maxLength: 100,
                }}
                render={({ field: { onChange, value } }) => (
                  <SliderWithTooltip
                    value={Number(value)}
                    onChange={onChange}
                    tooltipLabel={`${formattedAmount} B3TR`}
                  />
                )}
              />
              <HStack justify="space-between">
                <Text fontSize="sm">0 B3TR</Text>
                <Text fontSize="sm">{formattedBalance} B3TR</Text>
              </HStack>
              <FormHelperText>{`You've selected ${formattedAmount} B3TR `}</FormHelperText>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button type="submit" onClick={onClose} isLoading={isButtonLoading}>
              Swap
            </Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  )
}

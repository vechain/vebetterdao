import { useVot3Balance, useVot3TokenDetails } from "@/api"
import { useUnstakeB3tr } from "@/hooks"
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

export const RedeemB3trModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useVot3Balance(account ?? undefined)
  const { data: tokenDetails, isLoading: isTokensDetailsLoading } = useVot3TokenDetails()

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

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending, sendTransactionError } = useUnstakeB3tr({
    amount: scaledAmount,
  })

  const isButtonLoading = isTxReceiptLoading || sendTransactionPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true}>
      <ModalOverlay />
      <form onSubmit={handleSubmit(() => sendTransaction())}>
        <ModalContent>
          <ModalHeader>Redeem B3TR</ModalHeader>

          <ModalCloseButton />
          <ModalBody>
            <Text mb="4" fontSize={"sm"}>
              Redeem your B3TR for VOT3 tokens at a 1:1 ratio.
            </Text>
            <FormControl>
              <FormLabel>Amount to redeem</FormLabel>
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
                <Text fontSize="sm">0 VOT3</Text>
                <Text fontSize="sm">{formattedBalance} VOT3</Text>
              </HStack>
              <FormHelperText>{`You've selected ${formattedAmount} VOT3 `}</FormHelperText>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button type="submit" onClick={onClose} isLoading={isButtonLoading}>
              Redeem
            </Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  )
}

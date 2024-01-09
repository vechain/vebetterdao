import { TokenDetails, useVot3Balance, useVot3TokenDetails } from "@/api"
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
import { useEffect, useMemo, useState } from "react"
import { Control, Controller, useForm } from "react-hook-form"
import { SliderWithTooltip } from "./SliderWithTooltip"
import { ConfirmTransactionModalContent, TransactionStatus } from "./ConfirmTransactionModalContent"

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

  const {
    sendTransaction,
    isTxReceiptLoading,
    sendTransactionPending,
    sendTransactionError,
    txReceipt,
    txReceiptError,
  } = useUnstakeB3tr({
    amount: scaledAmount,
  })

  // worfklow status is one of "ready" | "pending" | "waitingConfirmation" | "success" | "error"
  // ready: the user has not clicked on the button yet
  // pending: the user has clicked on the button and we're waiting for the transaction to be sent
  // waitingConfirmation: the transaction has been sent and we're waiting for the transaction to be confirmed by the chain
  // success: the transaction has been confirmed by the chain
  // error: the transaction has failed
  // this cannot be a derived value since we need tochange it with user actions (onTryAgain)
  const [status, setStatus] = useState<TransactionStatus | "ready">("ready")

  useEffect(() => {
    if (sendTransactionPending) return setStatus("pending")

    if (isTxReceiptLoading) return setStatus("waitingConfirmation")

    if (sendTransactionError || txReceiptError) return setStatus("error")

    if (txReceipt) return setStatus("success")

    return setStatus("ready")
  }, [isTxReceiptLoading, sendTransactionPending, sendTransactionError, txReceipt, txReceiptError])

  const onSuccess = () => {
    setStatus("ready")
    onClose()
  }

  const renderContent = useMemo(() => {
    if (status !== "ready")
      return (
        <ConfirmTransactionModalContent
          description={`Redeem ${formattedAmount} B3TR`}
          status={status}
          error={sendTransactionError?.message ?? txReceiptError?.message}
          onSuccess={onSuccess}
          onTryAgain={() => setStatus("ready")}
        />
      )
    return (
      <RedeemB3trModalFormContent
        balance={balance}
        tokenDetails={tokenDetails}
        formattedAmount={formattedAmount}
        control={control}
      />
    )
  }, [status, balance, tokenDetails, formattedAmount, control])

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <form onSubmit={handleSubmit(() => sendTransaction())}>
        <ModalContent h={320}>{renderContent}</ModalContent>
      </form>
    </Modal>
  )
}

type RedeemB3trModalFormContentProps = {
  balance?: string
  tokenDetails?: TokenDetails
  formattedAmount: string
  control: Control<FormData, any>
}

const RedeemB3trModalFormContent: React.FC<RedeemB3trModalFormContentProps> = ({
  balance,
  tokenDetails,
  formattedAmount,
  control,
}) => {
  const formattedBalance = useMemo(() => {
    if (!balance) {
      return "0"
    }
    const scaledAmount = FormattingUtils.scaleNumberDown(balance, tokenDetails?.decimals ?? 18)
    return FormattingUtils.humanNumber(scaledAmount, scaledAmount)
  }, [balance])

  return (
    <>
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
              <SliderWithTooltip value={Number(value)} onChange={onChange} tooltipLabel={`${formattedAmount} B3TR`} />
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
        <Button type="submit">Redeem</Button>
      </ModalFooter>
    </>
  )
}

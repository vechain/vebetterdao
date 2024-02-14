import { useB3trBalance, useVot3Balance } from "@/api"
import { useStakeB3tr, useUnstakeB3tr } from "@/hooks"
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
  VStack,
} from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { SliderWithTooltip } from "./SliderWithTooltip"
import { ConfirmTransactionModalContent } from "./ConfirmTransactionModalContent"
import { useTotalBalance } from "@/api/contracts/account"

type Props = {
  isOpen: boolean
  onClose: () => void
}
type FormData = {
  amount: string
}

export const SwapB3trModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { account } = useWallet()
  const { data: b3trBalance } = useB3trBalance(account ?? undefined)
  const totalBalance = useTotalBalance(account ?? undefined)
  const initialB3trPercentageAmount = useMemo(() => {
    if (!b3trBalance || !totalBalance) {
      return "0"
    }
    return String((Number(b3trBalance.scaled) / Number(totalBalance.scaled)) * 100)
  }, [b3trBalance])

  const { handleSubmit, watch, control } = useForm<FormData>({ defaultValues: { amount: initialB3trPercentageAmount } })

  const watchB3trPercentageAmount = watch("amount", initialB3trPercentageAmount)

  const { b3trFormattedAmount, b3trScaledAmount } = useMemo(() => {
    if (!totalBalance) {
      return { formattedAmount: "0", scaledAmount: "0" }
    }

    const parsedPercentageAmount = Number(watchB3trPercentageAmount) / 100
    const b3trScaledAmount = Number(totalBalance.scaled) * parsedPercentageAmount

    const b3trFormattedAmount = FormattingUtils.humanNumber(b3trScaledAmount, b3trScaledAmount)
    return { b3trFormattedAmount, b3trScaledAmount }
  }, [totalBalance, watchB3trPercentageAmount])

  const { vot3FormattedAmount, vot3ScaledAmount } = useMemo(() => {
    if (!totalBalance) {
      return { formattedAmount: "0", scaledAmount: "0" }
    }

    const parsedPercentageAmount = (100 - Number(watchB3trPercentageAmount)) / 100
    const vot3ScaledAmount = Number(totalBalance.scaled) * parsedPercentageAmount

    const vot3FormattedAmount = FormattingUtils.humanNumber(vot3ScaledAmount, vot3ScaledAmount)
    return { vot3FormattedAmount, vot3ScaledAmount }
  }, [totalBalance, watchB3trPercentageAmount])

  const b3trToVot3Amount = useMemo(() => {
    if (!b3trBalance) {
      return "0"
    }
    return String(Number(b3trBalance.scaled) - Number(b3trScaledAmount))
  }, [b3trBalance, b3trScaledAmount])

  const normalizedB3trToVot3Amount = Number(b3trToVot3Amount) >= 0 ? b3trToVot3Amount : Number(b3trToVot3Amount) * -1

  const formattedNormalizedB3trToVot3Amount = useMemo(() => {
    return FormattingUtils.humanNumber(normalizedB3trToVot3Amount, normalizedB3trToVot3Amount)
  }, [normalizedB3trToVot3Amount])

  const swapText = useMemo(() => {
    if (b3trToVot3Amount === "0") {
      return ""
    }
    if (Number(b3trToVot3Amount) > 0) {
      return `You are swapping ${formattedNormalizedB3trToVot3Amount} B3TR to VOT3`
    } else {
      return `You are swapping ${formattedNormalizedB3trToVot3Amount} VOT3 to B3TR`
    }
  }, [b3trToVot3Amount, formattedNormalizedB3trToVot3Amount])

  const stakeMutation = useStakeB3tr({
    amount: normalizedB3trToVot3Amount,
  })

  const unstakeMutation = useUnstakeB3tr({
    amount: normalizedB3trToVot3Amount,
  })

  const { resetStatus, status, sendTransactionError, txReceiptError, sendTransaction } = useMemo(() => {
    if (Number(b3trToVot3Amount) >= 0) {
      return stakeMutation
    } else {
      return unstakeMutation
    }
  }, [b3trToVot3Amount, stakeMutation, unstakeMutation])

  const onSuccess = () => {
    resetStatus()
    onClose()
  }

  const renderContent = useMemo(() => {
    if (status !== "ready")
      return (
        <ConfirmTransactionModalContent
          description={swapText}
          status={status}
          error={sendTransactionError?.message ?? txReceiptError?.message}
          onSuccess={onSuccess}
          onTryAgain={resetStatus}
        />
      )
    return (
      <>
        <ModalCloseButton />
        <ModalHeader>Swap</ModalHeader>
        <ModalBody>
          <VStack align={"flex-start"} gap={8}>
            <Text as="b" fontSize={"sm"}>
              Swap B3TR ↔️ VOT3 at a 1:1 ratio
            </Text>
            <FormControl>
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
                    tooltipLabel={`${watchB3trPercentageAmount}% B3TR - ${100 - Number(watchB3trPercentageAmount)}% VOT3`}
                  />
                )}
              />
              <HStack justify="space-between">
                <Text fontSize="sm">{b3trFormattedAmount} B3TR</Text>
                <Text fontSize="sm">{vot3FormattedAmount} VOT3</Text>
              </HStack>
            </FormControl>
            <Text color="teal">{swapText}</Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button type="submit" isDisabled={Number(b3trToVot3Amount) === 0}>
            Swap
          </Button>
        </ModalFooter>
      </>
    )
  }, [b3trToVot3Amount, status, swapText, watchB3trPercentageAmount, b3trFormattedAmount, vot3FormattedAmount])

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <form onSubmit={handleSubmit(() => sendTransaction(undefined))}>
        <ModalContent h={320}>{renderContent}</ModalContent>
      </form>
    </Modal>
  )
}

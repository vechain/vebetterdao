import { useB3trBalance, useVot3Balance } from "@/api"
import { useStakeB3tr, useTokenColors, useUnstakeB3tr } from "@/hooks"
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
import { FaChevronRight } from "react-icons/fa"
import { FaArrowRight, FaRepeat } from "react-icons/fa6"

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

  const { handleSubmit, watch, control, setValue } = useForm<FormData>({
    defaultValues: { amount: initialB3trPercentageAmount },
  })

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

  const { b3trColor, vot3Color } = useTokenColors()

  const swapText = useMemo(() => {
    if (Number(b3trToVot3Amount) >= 0) {
      return (
        <HStack gap={2.5}>
          <VStack gap={0}>
            <Text color={b3trColor} fontSize={"12px"}>
              B3TR
            </Text>
            <Text as={"b"}>{formattedNormalizedB3trToVot3Amount}</Text>
          </VStack>
          <FaArrowRight />
          <VStack gap={0}>
            <Text color={vot3Color} fontSize={"12px"}>
              VOT3
            </Text>
            <Text as={"b"}>{formattedNormalizedB3trToVot3Amount}</Text>
          </VStack>
        </HStack>
      )
    } else {
      return (
        <HStack gap={2.5}>
          <VStack gap={0}>
            <Text color={vot3Color} fontSize={"12px"}>
              VOT3
            </Text>
            <Text as={"b"}>{formattedNormalizedB3trToVot3Amount}</Text>
          </VStack>
          <FaArrowRight />
          <VStack gap={0}>
            <Text color={b3trColor} fontSize={"12px"}>
              B3TR
            </Text>
            <Text as={"b"}>{formattedNormalizedB3trToVot3Amount}</Text>
          </VStack>
        </HStack>
      )
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
    setValue("amount", initialB3trPercentageAmount)
  }

  if (status !== "ready")
    return (
      <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
        <ModalOverlay />
        <ModalContent>
          <ConfirmTransactionModalContent
            description={" "}
            status={status}
            error={sendTransactionError?.message ?? txReceiptError?.message}
            onSuccess={onSuccess}
            onTryAgain={resetStatus}
          />
        </ModalContent>
      </Modal>
    )
  return (
    <Modal isCentered onClose={onClose} isOpen={isOpen} scrollBehavior="outside" motionPreset="slideInBottom">
      <ModalOverlay />
      <ModalContent position="fixed" bottom="0px" mb="0" borderRadius="1.75rem 1.75rem 0px 0px" maxW="2xl">
        <form onSubmit={handleSubmit(() => sendTransaction(undefined))}>
          <ModalCloseButton />
          <ModalHeader>
            <Text>Swap</Text>
            <Text fontSize={"xs"}>1 B3TR = 1 VOT3</Text>
          </ModalHeader>
          <ModalBody>
            <VStack align={"flex-start"} gap={4}>
              <FormControl>
                <HStack justify="space-between">
                  <HStack gap={1}>
                    <Text as={"b"}>{b3trFormattedAmount}</Text>
                    <Text color={b3trColor} fontSize={"12px"}>
                      B3TR
                    </Text>
                  </HStack>
                  <HStack gap={1}>
                    <Text as={"b"}>{vot3FormattedAmount}</Text>
                    <Text color={vot3Color} fontSize={"12px"}>
                      VOT3
                    </Text>
                  </HStack>
                </HStack>
                <Controller
                  name="amount"
                  control={control}
                  rules={{
                    maxLength: 100,
                  }}
                  render={({ field: { onChange, value } }) => (
                    <SliderWithTooltip value={Number(value)} onChange={onChange} />
                  )}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack w={"full"} justify={"space-between"}>
              {swapText}
              <Button type="submit" isDisabled={Number(b3trToVot3Amount) === 0} leftIcon={<FaRepeat />}>
                Swap
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

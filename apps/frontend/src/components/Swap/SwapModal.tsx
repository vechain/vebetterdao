"use-client"
import {
  Button,
  Card,
  CardBody,
  Flex,
  HStack,
  Heading,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalCloseButton,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useStakeB3tr, useTokenColors, useUnstakeB3tr } from "@/hooks"
import { FaArrowRight } from "react-icons/fa6"
import { useForm } from "react-hook-form"
import { CustomModalContent } from "../CustomModalContent"
import { SwitchTokenButton } from "./SwitchTokenButton"
import { TokenCards } from "./TokenCards"
import { TransactionModal } from "../TransactionModal"
import { useB3trBalance, useB3trStaked, useVot3Balance } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"

export type Props = {
  isOpen: boolean
  onClose: () => void
}

const DECIMAL_PLACES = 4

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: DECIMAL_PLACES,
})

export const SwapModal = ({ isOpen, onClose }: Props) => {
  const [isB3trToVot3, setIsB3trToVot3] = useState(true)

  const { account } = useWallet()

  const { data: b3trBalance } = useB3trBalance(account ?? undefined)
  const { data: vot3Balance } = useVot3Balance(account ?? undefined)
  const { data: swappableVot3Balance } = useB3trStaked(account ?? undefined)

  const formData = useForm<{ amount: string }>({
    defaultValues: {
      amount: "",
    },
  })
  const { watch, setValue } = formData
  const amount = watch("amount")
  const invalidAmount = useMemo(() => Number(amount) === 0 || isNaN(Number(amount)), [amount])

  const stakeMutation = useStakeB3tr({
    amount,
  })

  const unstakeMutation = useUnstakeB3tr({
    amount,
  })

  const isVOT3BalanceMoreThanStakedB3TR = useMemo(() => {
    if (!swappableVot3Balance || !vot3Balance) return true

    return vot3Balance.original > swappableVot3Balance.original
  }, [vot3Balance?.original, swappableVot3Balance?.original])

  const mutationData = useMemo(() => {
    if (isB3trToVot3) {
      return stakeMutation
    } else {
      return unstakeMutation
    }
  }, [isB3trToVot3, stakeMutation, unstakeMutation])

  const handleStake = useCallback(() => {
    mutationData.resetStatus()
    mutationData.sendTransaction(undefined)
  }, [mutationData.sendTransaction])

  const handleClose = useCallback(() => {
    mutationData.resetStatus()
    onClose()
    setIsB3trToVot3(true)
    setValue("amount", "")
  }, [mutationData.resetStatus, onClose])

  const { b3trColor, vot3Color } = useTokenColors()

  const amountText = useMemo(() => {
    const amountNumber = Number(amount)

    if (amountNumber < 0.0001) return `< 0.${"0".repeat(DECIMAL_PLACES - 1)}1`

    return compactFormatter.format(amountNumber)
  }, [amount])

  const swapText = useMemo(() => {
    if (isB3trToVot3) {
      return (
        <HStack>
          <Text as="b">{amountText}</Text>
          <Text color={b3trColor}>B3TR</Text>
          <FaArrowRight />
          <Text as="b">{amountText}</Text>
          <Text color={vot3Color}>VOT3</Text>
        </HStack>
      )
    } else {
      return (
        <HStack>
          <Text as="b">{amountText}</Text>
          <Text color={vot3Color}>VOT3</Text>
          <FaArrowRight />
          <Text as="b">{amountText}</Text>
          <Text color={b3trColor}>B3TR</Text>
        </HStack>
      )
    }
  }, [isB3trToVot3, amount])

  if (mutationData.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        confirmationTitle={swapText}
        successTitle={"Swap Completed!"}
        status={mutationData.error ? "error" : mutationData.status}
        errorDescription={mutationData.error?.reason}
        errorTitle={mutationData.error ? "Error swapping" : undefined}
        showTryAgainButton
        onTryAgain={handleStake}
        pendingTitle="Swapping..."
        showSocialButtons
        socialDescriptionEncoded="%F0%9F%94%84%20Just%20swapped%20between%20B3TR%20and%20VOT3%20on%20%23VeBetterDAO%21%20%0A%0A%F0%9F%8C%B1%20Explore%20and%20join%20us%20at%20https%3A%2F%2Fvebetterdao.org.%0A%0A%23VeBetterDAO%20%23Vechain"
        showExplorerButton
        txId={mutationData.txReceipt?.meta.txID ?? mutationData.sendTransactionTx?.txid}
      />
    )

  return (
    <Modal isOpen={isOpen} onClose={handleClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent>
        <Card w="full" rounded={20}>
          <CardBody>
            <form onSubmit={formData.handleSubmit(handleStake)}>
              <ModalCloseButton top={4} right={4} />
              <VStack align={"flex-start"}>
                <Heading size="md" mb={4}>
                  Swap
                </Heading>
                <Flex color={"black"} position={"relative"}>
                  <TokenCards
                    amount={amount}
                    formData={formData}
                    isB3trToVot3={isB3trToVot3}
                    isVOT3BalanceMoreThanStakedB3TR={isVOT3BalanceMoreThanStakedB3TR}
                    b3trBalance={b3trBalance}
                    vot3Balance={vot3Balance}
                    swappableVot3Balance={swappableVot3Balance}
                  />
                  <SwitchTokenButton setIsB3trToVot3={setIsB3trToVot3} />
                </Flex>
                {isVOT3BalanceMoreThanStakedB3TR && (
                  <Text fontSize={"xs"} mt={2} px={2}>
                    The amount of VOT3 tokens you can swap back to B3TR is based on the total B3TR you have converted
                    into VOT3.
                  </Text>
                )}
                <Button
                  mt={2}
                  type="submit"
                  colorScheme="primary"
                  w={"full"}
                  rounded={"full"}
                  isDisabled={invalidAmount}
                  size="lg">
                  Swap
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </CustomModalContent>
    </Modal>
  )
}

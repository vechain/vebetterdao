import { UseSendTransactionReturnValue, useTokenColors, useUnstakeB3tr } from "@/hooks"
import { ModalOverlay, ModalContent, Modal, Text, HStack, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { ConfirmTransactionModalContent } from "./ConfirmTransactionModalContent"
import { FaArrowRight } from "react-icons/fa6"

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mutationData: UseSendTransactionReturnValue
  isB3trToVot3: boolean
  amount: string
}

export const SwapModal = ({ isOpen, onClose, mutationData, onSuccess, isB3trToVot3, amount }: Props) => {
  const { b3trColor, vot3Color } = useTokenColors()
  const swapText = useMemo(() => {
    if (isB3trToVot3) {
      return (
        <HStack>
          <Text as="b">{amount}</Text>
          <Text color={b3trColor}>B3TR</Text>
          <FaArrowRight />
          <Text as="b">{amount}</Text>
          <Text color={vot3Color}>VOT3</Text>
        </HStack>
      )
    } else {
      return (
        <HStack>
          <Text as="b">{amount}</Text>
          <Text color={vot3Color}>VOT3</Text>
          <FaArrowRight />
          <Text as="b">{amount}</Text>
          <Text color={b3trColor}>B3TR</Text>
        </HStack>
      )
    }
  }, [isB3trToVot3, amount])

  return (
    <Modal isOpen={isOpen && mutationData.status !== "ready"} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <ModalContent>
        <ConfirmTransactionModalContent
          description={swapText}
          status={mutationData.status}
          error={mutationData.sendTransactionError?.message ?? mutationData.txReceiptError?.message}
          onSuccess={onSuccess}
          onTryAgain={mutationData.resetStatus}
          onSuccessTimeout={0}
        />
      </ModalContent>
    </Modal>
  )
}

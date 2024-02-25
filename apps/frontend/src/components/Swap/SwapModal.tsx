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
  ModalContent,
  ModalOverlay,
  ModalCloseButton,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useStakeB3tr, useTokenColors, useUnstakeB3tr } from "@/hooks"
import { FaArrowRight } from "react-icons/fa6"
import { useForm } from "react-hook-form"
import { ConfirmTransactionModalContent } from "../ConfirmTransactionModalContent"
import { CustomModalContent } from "../CustomModalContent"
import { SwitchTokenButton } from "./SwitchTokenButton"
import { TokenCards } from "./TokenCards"
import { ConfirmationModal } from "../Modals/ConfirmationModal"
import { LoadingModal } from "../Modals/LoadingModal"
import { SuccessModal } from "../Modals/SuccessModal"
import { ErrorModal } from "../Modals/ErrorModal"
export type Props = {
  isOpen: boolean
  onClose: () => void
}

export const SwapModal = ({ isOpen, onClose }: Props) => {
  const [isB3trToVot3, setIsB3trToVot3] = useState(true)

  const formData = useForm<{ amount: string }>()
  const { watch, setValue } = formData
  const amount = String(Number(watch("amount")) || "")

  const stakeMutation = useStakeB3tr({
    amount,
  })

  const unstakeMutation = useUnstakeB3tr({
    amount,
  })

  const mutationData = useMemo(() => {
    if (isB3trToVot3) {
      return stakeMutation
    } else {
      return unstakeMutation
    }
  }, [isB3trToVot3, stakeMutation, unstakeMutation])

  const handleStake = useCallback(() => {
    mutationData.sendTransaction(undefined)
  }, [mutationData.sendTransaction])

  const handleClose = useCallback(() => {
    mutationData.resetStatus()
    onClose()
    setIsB3trToVot3(true)
    setValue("amount", "")
  }, [mutationData.resetStatus, onClose])

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

  if (mutationData.status === "pending") return <ConfirmationModal isOpen={isOpen} onClose={handleClose} />

  if (mutationData.status === "error") return <ErrorModal isOpen={isOpen} onClose={handleClose} />

  if (mutationData.status === "waitingConfirmation") return <LoadingModal isOpen={isOpen} onClose={handleClose} />

  if (mutationData.status === "success")
    return (
      <SuccessModal
        isOpen={isOpen}
        onClose={handleClose}
        title={"Swap Completed! 🎉"}
        showSocialButtons
        socialDescription="I just swapped B3TR for VOT3 on B3tr Finance! 🎉 #B3tr #VOT3"
      />
    )

  if (mutationData.status !== "ready")
    return (
      <Modal isOpen={isOpen} onClose={handleClose} trapFocus={true} isCentered={true}>
        <ModalOverlay />
        <ModalContent>
          <ConfirmTransactionModalContent
            description={swapText}
            status={mutationData.status}
            error={mutationData.sendTransactionError?.message ?? mutationData.txReceiptError?.message}
            onSuccess={handleClose}
            onTryAgain={mutationData.resetStatus}
          />
        </ModalContent>
      </Modal>
    )

  return (
    <Modal isOpen={isOpen} onClose={handleClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent>
        <Card w="full" rounded={20}>
          <CardBody>
            <ModalCloseButton top={4} right={4} />
            <VStack align={"flex-start"}>
              <Heading size="md" mb={4}>
                Swap
              </Heading>
              <Flex color={"black"} position={"relative"}>
                <TokenCards amount={amount} formData={formData} isB3trToVot3={isB3trToVot3} />
                <SwitchTokenButton setIsB3trToVot3={setIsB3trToVot3} />
              </Flex>
              <Flex justify={"flex-end"} w="full" mt={2}>
                <Button
                  colorScheme="primary"
                  w={"full"}
                  rounded={"full"}
                  isDisabled={Number(amount) === 0}
                  onClick={handleStake}
                  size="lg">
                  Swap
                </Button>
              </Flex>
            </VStack>
          </CardBody>
        </Card>
      </CustomModalContent>
    </Modal>
  )
}

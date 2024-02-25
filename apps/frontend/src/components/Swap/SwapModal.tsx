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

  if (mutationData.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={mutationData.status}
        confirmationTitle={swapText}
        successTitle={"Swap Completed!"}
        showSocialButtons
        socialDescription="I just swapped B3TR for VOT3 on B3tr Finance! 🎉 #B3tr #VOT3"
      />
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

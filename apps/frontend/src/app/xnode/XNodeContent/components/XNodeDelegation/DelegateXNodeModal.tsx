import {
  Alert,
  Box,
  Button,
  Field,
  Heading,
  Input,
  Text,
  useBreakpointValue,
  UseDisclosureProps,
  VStack,
} from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet, useVechainDomain } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useDelegateXNode } from "@/hooks/useDelegateXNode"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { UserNode } from "../../../../../api/contracts/xNodes/useGetUserNodes"
import { ExclamationTriangle } from "../../../../../components/Icons/ExclamationTriangle"
import { Step, StepModal } from "../../../../../components/StepModal/StepModal"

type FormData = {
  walletAddress: string
}
enum DelegateXNodeStep {
  ENTER_ADDRESS = "ENTER_ADDRESS",
  CONFIRM_DELEGATION = "CONFIRM_DELEGATION",
}
const STEP_COUNT = Object.keys(DelegateXNodeStep).length
export const DelegateXNodeModal = ({ xNode, modal }: { xNode: UserNode; modal: UseDisclosureProps }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { account } = useWallet()
  const { open: isOpen = false, onClose } = modal
  const isXNodeAttachedToGM = !!xNode?.gmTokenIdAttachedToNode
  const [step, setStep] = useState(0)
  const goToNext = useCallback(() => {
    const nextStep = step + 1
    if (nextStep > STEP_COUNT) onClose?.()
    else setStep(nextStep)
  }, [step, onClose])
  const goToPrevious = useCallback(() => {
    const prevStep = step - 1
    if (prevStep < 1) onClose?.()
    else setStep(prevStep)
  }, [step, onClose])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>()

  const delegateeAddressOrDomain = watch("walletAddress")

  const handleClose = useCallback(() => {
    onClose?.()
    setStep(0)
  }, [onClose, setStep])

  const delegateXNode = useDelegateXNode({
    xNode,
    onSuccess: handleClose,
  })
  const triangleSize = useBreakpointValue({ base: 100, md: 220 })
  const { data: vnsData } = useVechainDomain(delegateeAddressOrDomain)
  const delegateeAddress = vnsData?.address
  const finalAddress = delegateeAddress ?? delegateeAddressOrDomain

  const proceedToConfirmation = useCallback(async () => {
    goToNext()
  }, [goToNext])

  const handleDelegate = useCallback(() => {
    delegateXNode.sendTransaction({
      delegatee: finalAddress,
      isAttachedToGM: isXNodeAttachedToGM,
    })
  }, [delegateXNode, finalAddress, isXNodeAttachedToGM])

  const steps = useMemo<Step<DelegateXNodeStep>[]>(
    () => [
      {
        key: DelegateXNodeStep.ENTER_ADDRESS,
        content: (
          <VStack align="stretch" gap={6} as="form" onSubmit={handleSubmit(proceedToConfirmation)}>
            <Box>
              <Text color="text.subtle" as="span">
                {t(
                  "By adding a manager to your Node, another address will be able to endorse apps and upgrade GM NFTs using your Node.",
                )}
              </Text>
              <Text color="text.subtle" as="span" fontWeight="semibold">
                {t("The manager won't be able to transfer or sell your Node.")}
              </Text>
            </Box>
            <VStack align="stretch">
              <Heading textStyle="lg">{t("Who do you want to add as a manager?")}</Heading>
              <Field.Root invalid={!!errors.walletAddress}>
                <Field.Label color="text.subtle" textStyle="sm">
                  {t("User wallet address")}
                </Field.Label>
                <Input
                  {...register("walletAddress", {
                    required: t("Wallet address is required"),
                    validate: async value => {
                      if (compareAddresses(value, account?.address ?? "")) {
                        return t("Please enter a valid wallet address")
                      }

                      return true
                    },
                  })}
                />
                <Field.ErrorText>{errors?.walletAddress?.message}</Field.ErrorText>
              </Field.Root>
            </VStack>
            <VStack align="stretch">
              <Button variant="primary" type="submit">
                {t("Continue")}
              </Button>
              <Button variant="ghost" color="actions.tertiary.default" onClick={handleClose}>
                {t("Cancel")}
              </Button>
            </VStack>
          </VStack>
        ),
        title: t("Delegate your Node"),
      },
      {
        key: DelegateXNodeStep.CONFIRM_DELEGATION,
        content: (
          <VStack align="stretch" gap={6}>
            <VStack justify="center" align="center" gap={10}>
              <ExclamationTriangle color="status.negative.primary" size={triangleSize} />
              <Heading size={["lg", "lg", "2xl"]} textAlign="center">
                {t("Are you sure you want to add a manager to your Node?")}
              </Heading>
            </VStack>
            <VStack align="stretch">
              <Text fontWeight="semibold">{t("You're adding the following manager to your Node")}</Text>
              <Text textStyle="sm">{finalAddress}</Text>
            </VStack>
            <Alert.Root status="warning" borderRadius="2xl">
              <Alert.Indicator w={5} h={5} />
              <Box textStyle="sm">
                <Alert.Title as="span">{t("The manager won't be able to transfer or sell your Node.")}</Alert.Title>
                <Alert.Description as="span">{t("but won't be able to transfer or sell your Node.")}</Alert.Description>
                {isXNodeAttachedToGM && (
                  <Text mt={2} textStyle="sm" color="status.negative.primary" fontWeight="semibold">
                    {t("Notice: the GM NFT attached to this Node will be detached and will lose the free levels.")}
                  </Text>
                )}
              </Box>
            </Alert.Root>
            <VStack>
              <Button variant="primary" onClick={handleDelegate}>
                {t("Yes, I'm sure")}
              </Button>
              <Button variant="ghost" color="actions.tertiary.default" onClick={goToPrevious}>
                {t("No, go back")}
              </Button>
            </VStack>
          </VStack>
        ),
        title: t("Confirm Delegation"),
      },
    ],
    [
      t,
      handleSubmit,
      proceedToConfirmation,
      register,
      errors,
      handleClose,
      triangleSize,
      finalAddress,
      isXNodeAttachedToGM,
      handleDelegate,
      goToPrevious,
      account?.address,
    ],
  )

  return (
    <StepModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={handleClose}
      goToPrevious={goToPrevious}
      goToNext={goToNext}
      setActiveStep={setStep}
      steps={steps}
      activeStep={step}
    />
  )
}

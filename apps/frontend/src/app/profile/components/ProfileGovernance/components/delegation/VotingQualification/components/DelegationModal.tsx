import {
  Heading,
  Text,
  UseDisclosureProps,
  VStack,
  Field,
  Button,
  Box,
  Alert,
  useBreakpointValue,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useDelegatePassport } from "@/hooks/useDelegatePassport"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { useAccountLinking } from "../../../../../../../../api/contracts/vePassport/hooks/useAccountLinking"
import { ExclamationTriangle } from "../../../../../../../../components/Icons/ExclamationTriangle"
import { StepModal, type Step } from "../../../../../../../../components/StepModal/StepModal"
import { WalletAddressInput } from "../../../../../../../components/Input/WalletAddressInput"

type FormData = {
  walletAddress: string
}
enum DelegationStep {
  ENTER_ADDRESS = "ENTER_ADDRESS",
  CONFIRM_DELEGATION = "CONFIRM_DELEGATION",
}
const STEP_COUNT = Object.keys(DelegationStep).length
export const DelegationModal = ({ modal }: { modal: UseDisclosureProps }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { handleSubmit, setValue, watch } = useForm<FormData>()
  const { isEntity } = useAccountLinking()
  const { open: isOpen = false, onClose } = modal
  const [step, setStep] = useState(0)
  const delegatee = watch("walletAddress")
  
  const handleClose = useCallback(() => {
    onClose?.()
    setStep(0)
  }, [onClose])
  
  const goToNext = useCallback(() => {
    const nextStep = step + 1
    if (nextStep >= STEP_COUNT) handleClose()
    else setStep(nextStep)
  }, [step, handleClose])

  const goToPrevious = useCallback(() => {
    const prevStep = step - 1
    if (prevStep < 0) handleClose()
    else setStep(prevStep)
  }, [step, handleClose])

  const delegatePassport = useDelegatePassport({
    onSuccess: handleClose,
  })

  const handleDelegate = useCallback(() => {
    delegatePassport.sendTransaction({ delegatee })
  }, [delegatePassport, delegatee])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  // Address Entry Content
  const AddressEntryContent = useMemo(
    () => (
      <VStack align="stretch" gap={6} as="form" onSubmit={handleSubmit(goToNext)}>
        <Box>
          <Text color="text.subtle" as="span">
            {t(
              "By delegating your qualification, another person will be able to vote on next round's allocation and proposals.",
            )}
          </Text>
          <Text color="text.subtle" as="span" fontWeight="semibold">
            {t("You won't lose any of your VOT3 or B3TR tokens with this operation.")}
          </Text>
        </Box>
        <VStack align="stretch">
          <Heading textStyle="lg">{t("Who do you want to add as a manager?")}</Heading>
          <Field.Root invalid={!delegatee}>
            <Field.Label color="text.subtle" textStyle="sm">
              {t("User wallet address")}
            </Field.Label>
            <WalletAddressInput
              disabled={isEntity}
              onAddressResolved={address => setValue("walletAddress", address ?? "")}
            />
            {isEntity ? (
              <Text color="status.negative.primary" textStyle="sm">
                {t("You can't delegate from an account linked as a secondary account")}
              </Text>
            ) : null}
          </Field.Root>
        </VStack>
        <VStack alignItems="stretch">
          <Button variant="primary" type="submit" disabled={isEntity || !delegatee}>
            {t("Send request")}
          </Button>

          <Button variant="ghost" color="status.negative.primary" onClick={handleClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    ),
    [handleSubmit, goToNext, t, delegatee, isEntity, handleClose, setValue],
  )
  // Confirmation Content
  const ConfirmationContent = useMemo(
    () => (
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle color="status.negative.primary" size={triangleSize} />
          <Heading size={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to delegate your Voting Qualification?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="semibold">{t("You're delegating it to")}</Text>
          <Text textStyle="sm">{delegatee}</Text>
        </VStack>
        <Alert.Root status="error" borderRadius="2xl">
          <Alert.Indicator w={9} h={9} />
          <Box color="status.negative.primary" textStyle="sm">
            <Alert.Title as="span">{t("You will not be able to vote until you remove the delegation")}</Alert.Title>
            <Alert.Description as="span">{t("or you receive someone else’s voting qualification.")}</Alert.Description>
          </Box>
        </Alert.Root>
        <VStack>
          <Button variant="primary" onClick={handleDelegate}>
            {t("Yes, I'm sure")}
          </Button>
          <Button variant="link" onClick={goToPrevious}>
            {t("No, go back")}
          </Button>
        </VStack>
      </VStack>
    ),
    [delegatee, goToPrevious, handleDelegate, t, triangleSize],
  )

  const steps = useMemo<Step<DelegationStep>[]>(
    () => [
      {
        key: DelegationStep.ENTER_ADDRESS,
        content: AddressEntryContent,
        title: t("Delegate your Voting Qualification"),
      },
      {
        key: DelegationStep.CONFIRM_DELEGATION,
        content: ConfirmationContent,
        title: t("Confirm Delegation"),
      },
    ],
    [AddressEntryContent, ConfirmationContent, t],
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

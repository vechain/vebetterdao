import {
  Heading,
  Text,
  UseDisclosureProps,
  VStack,
  FormControl,
  FormLabel,
  Button,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
  useSteps,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { useDelegatePassport } from "@/hooks/useDelegatePassport"
import { useCallback, useMemo } from "react"
import { ExclamationTriangle } from "@/components"
import { useAccountLinking } from "@/api"
import { WalletAddressInput } from "@/app/components/Input"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { StepModal, type Step } from "@/components/StepModal"

type FormData = {
  walletAddress: string
}

enum DelegationStep {
  ENTER_ADDRESS = "ENTER_ADDRESS",
  CONFIRM_DELEGATION = "CONFIRM_DELEGATION",
}

export const DelegationModal = ({ modal }: { modal: UseDisclosureProps }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { handleSubmit, setValue, watch } = useForm<FormData>()
  const { isEntity } = useAccountLinking()
  const { isOpen = false, onClose } = modal

  const { activeStep, goToPrevious, goToNext, setActiveStep } = useSteps({
    index: 0,
    count: Object.keys(DelegationStep).length,
  })

  const delegatee = watch("walletAddress")

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

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
          <Text color="#6A6A6A" as="span">
            {t(
              "By delegating your qualification, another person will be able to vote on next round's allocation and proposals.",
            )}
          </Text>
          <Text color="#6A6A6A" as="span" fontWeight="600">
            {t("You won't lose any of your VOT3 or B3TR tokens with this operation.")}
          </Text>
        </Box>
        <VStack align="stretch">
          <Heading fontSize="lg">{t("Who do you want to delegate to?")}</Heading>
          <FormControl isInvalid={!delegatee}>
            <FormLabel color="#6A6A6A" fontSize="sm">
              {t("User wallet address")}
            </FormLabel>
            <WalletAddressInput
              isDisabled={isEntity}
              onAddressResolved={address => setValue("walletAddress", address ?? "")}
            />
            {isEntity ? (
              <Text color="#C84968" fontSize="sm">
                {t("You can't delegate from an account linked as a secondary account")}
              </Text>
            ) : null}
          </FormControl>
        </VStack>
        <VStack align="stretch">
          <Button variant="primaryAction" type="submit" isDisabled={isEntity || !delegatee}>
            {t("Send request")}
          </Button>

          <Button variant={"primaryGhost"} onClick={handleClose}>
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
          <ExclamationTriangle color="#C84968" size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to delegate your Voting Qualification?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="600">{t("You're delegating it to")}</Text>
          <Text fontSize="sm">{delegatee}</Text>
        </VStack>
        <Alert status="error" borderRadius="2xl">
          <AlertIcon w={9} h={9} />
          <Box lineHeight={"1.20rem"} color="#C84968" fontSize="sm">
            <AlertTitle as="span">{t("You will not be able to vote until you remove the delegation")}</AlertTitle>
            <AlertDescription as="span">{t("or you receive someone else’s voting qualification.")}</AlertDescription>
          </Box>
        </Alert>
        <VStack>
          <Button variant="primaryAction" onClick={handleDelegate}>
            {t("Yes, I'm sure")}
          </Button>
          <Button variant={"primaryGhost"} onClick={goToPrevious}>
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
      setActiveStep={setActiveStep}
      steps={steps}
      activeStep={activeStep}
    />
  )
}

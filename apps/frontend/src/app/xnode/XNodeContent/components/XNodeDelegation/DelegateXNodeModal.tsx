import { useXNode } from "@/api"
import { getIsNodeHolder } from "@/api/contracts/xNodes/useIsNodeHolder"
import { ExclamationTriangle } from "@/components"
import { useDelegateXNode } from "@/hooks/useDelegateXNode"
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
  useBreakpointValue,
  UseDisclosureProps,
  VStack,
  useSteps,
} from "@chakra-ui/react"
import { compareAddresses, isValid } from "@repo/utils/AddressUtils"
import { useWallet, useConnex, useVechainDomain } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { StepModal, type Step } from "@/components/StepModal"

type FormData = {
  walletAddress: string
}

enum DelegateXNodeStep {
  ENTER_ADDRESS = "ENTER_ADDRESS",
  CONFIRM_DELEGATION = "CONFIRM_DELEGATION",
}

export const DelegateXNodeModal = ({ modal }: { modal: UseDisclosureProps }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { account } = useWallet()
  const { thor } = useConnex()
  const { isXNodeAttachedToGM } = useXNode()
  const { isOpen = false, onClose } = modal

  const { activeStep, goToPrevious, goToNext, setActiveStep } = useSteps({
    index: 0,
    count: Object.keys(DelegateXNodeStep).length,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>()

  const delegateeAddressOrDomain = watch("walletAddress")

  const handleClose = useCallback(() => {
    onClose?.()
    setActiveStep(0)
  }, [onClose, setActiveStep])

  const delegateXNode = useDelegateXNode({
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
              <Text color="#6A6A6A" as="span">
                {t(
                  "By adding a manager to your Node, another address will be able to endorse apps and upgrade GM NFTs using your Node.",
                )}
              </Text>
              <Text color="#6A6A6A" as="span" fontWeight="600">
                {t("The manager won't be able to transfer or sell your Node.")}
              </Text>
            </Box>
            <Alert status="warning" borderRadius="2xl">
              <AlertIcon />
              <Box>
                <AlertDescription as="span" fontSize="sm">
                  {t("Currently, we only support one Node per account.")}
                </AlertDescription>
              </Box>
            </Alert>
            <VStack align="stretch">
              <Heading fontSize="lg">{t("Who do you want to add as a manager?")}</Heading>
              <FormControl isInvalid={!!errors.walletAddress}>
                <FormLabel color="#6A6A6A" fontSize="sm">
                  {t("User wallet address")}
                </FormLabel>
                <Input
                  {...register("walletAddress", {
                    required: t("Wallet address is required"),
                    validate: async value => {
                      if (compareAddresses(value, account?.address ?? "")) {
                        return t("Please enter a valid wallet address")
                      }

                      const address = isValid(value) ? value : delegateeAddress
                      try {
                        const hasExistingXNode = await getIsNodeHolder(thor, address ?? "")
                        if (hasExistingXNode) {
                          return t("This address already has a Node. Please choose another address.")
                        }
                        return true
                      } catch (error) {
                        console.error("Error checking node holder status:", error)
                        return t("Error checking node holder status. Please try again.")
                      }
                    },
                  })}
                />
                <FormErrorMessage>{errors?.walletAddress?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
            <VStack align="stretch">
              <Button variant="primaryAction" type="submit">
                {t("Continue")}
              </Button>
              <Button variant={"primaryGhost"} onClick={handleClose}>
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
              <ExclamationTriangle color="#C84968" size={triangleSize} />
              <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
                {t("Are you sure you want to add a manager to your Node?")}
              </Heading>
            </VStack>
            <VStack align="stretch">
              <Text fontWeight="600">{t("You're adding the following manager to your Node")}</Text>
              <Text fontSize="sm">{finalAddress}</Text>
            </VStack>
            <Alert status="warning" borderRadius="2xl">
              <AlertIcon w={5} h={5} />
              <Box lineHeight={"1.20rem"} fontSize="sm">
                <AlertTitle as="span">{t("The manager won't be able to transfer or sell your Node.")}</AlertTitle>
                <AlertDescription as="span">{t("but won't be able to transfer or sell your Node.")}</AlertDescription>
                {isXNodeAttachedToGM && (
                  <Text mt={2} fontSize="sm" color="#C84968" fontWeight={600}>
                    {t("Notice: the GM NFT attached to this Node will be detached and will lose the free levels.")}
                  </Text>
                )}
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
      thor,
      delegateeAddress,
    ],
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

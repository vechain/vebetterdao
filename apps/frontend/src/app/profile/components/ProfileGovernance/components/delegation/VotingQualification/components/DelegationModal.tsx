import { BaseModal } from "@/components/BaseModal"
import {
  Heading,
  Text,
  UseDisclosureProps,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  FormErrorMessage,
  Box,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
} from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { isValid } from "@repo/utils/AddressUtils"
import { useDelegatePassport } from "@/hooks/useDelegatePassport"
import { useCallback } from "react"
import { ExclamationTriangle, TransactionModal } from "@/components"
import { useAccountLinking } from "@/api"

type FormData = {
  walletAddress: string
}

export const DelegationModal = ({ modal }: { modal: UseDisclosureProps }) => {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>()
  const { isEntity } = useAccountLinking()

  const confirmationModal = useDisclosure()

  const delegatee = watch("walletAddress")

  const delegatePassport = useDelegatePassport({})

  const openConfirmationModal = useCallback(() => {
    confirmationModal.onOpen()
  }, [confirmationModal])

  const handleDelegate = useCallback(() => {
    delegatePassport.sendTransaction({ delegatee })
  }, [delegatePassport, delegatee])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  const handleClose = useCallback(() => {
    modal.onClose?.()
    confirmationModal.onClose?.()
    delegatePassport.resetStatus()
    reset()
  }, [modal, confirmationModal, delegatePassport, reset])

  if (delegatePassport.status !== "ready") {
    return (
      <TransactionModal
        isOpen={modal.isOpen ?? false}
        onClose={handleClose}
        successTitle={t("Delegation completed!")}
        status={delegatePassport.status}
        errorDescription={delegatePassport.error?.reason}
        errorTitle={delegatePassport.error ? t("Error delegating") : undefined}
        showTryAgainButton
        onTryAgain={() => delegatePassport.sendTransaction({ delegatee })}
        pendingTitle={t("Delegating...")}
        showExplorerButton
        txId={delegatePassport.txReceipt?.meta.txID ?? delegatePassport.sendTransactionTx?.txid}
      />
    )
  }

  if (confirmationModal.isOpen) {
    return (
      <BaseModal onClose={handleClose} isOpen={confirmationModal.isOpen ?? false}>
        <VStack align="stretch" gap={6}>
          <VStack justify="center" align="center" gap={10}>
            <ExclamationTriangle color="#C84968" size={triangleSize} />
            <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
              {t("Are you sure you want to delegate your Voting Qualification?")}
            </Heading>
          </VStack>
          <VStack align="stretch">
            <Text fontWeight="600">{t("You’re delegating it to")}</Text>
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
            <Button variant={"primaryGhost"} onClick={confirmationModal.onClose}>
              {t("No, go back")}
            </Button>
          </VStack>
        </VStack>
      </BaseModal>
    )
  }

  return (
    <BaseModal onClose={handleClose} isOpen={modal.isOpen ?? false}>
      <VStack align="stretch" gap={6} as="form" onSubmit={handleSubmit(openConfirmationModal)}>
        <UilArrowUpRight color="#004CFC" />
        <Heading fontSize="2xl">{t("Delegate your Voting Qualification")}</Heading>
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
          <FormControl isInvalid={!!errors.walletAddress}>
            <FormLabel color="#6A6A6A" fontSize="sm">
              {t("User wallet address")}
            </FormLabel>
            <Input
              disabled={isEntity}
              {...register("walletAddress", {
                required: t("Wallet address is required"),
                validate: value => isValid(value) || t("Please enter a valid wallet address"),
              })}
            />
            {isEntity ? (
              <Text color="#C84968" fontSize="sm">
                {t("You can't delegate from an account linked as a secondary account")}
              </Text>
            ) : (
              <FormErrorMessage>{errors.walletAddress && errors.walletAddress.message}</FormErrorMessage>
            )}
          </FormControl>
        </VStack>
        <VStack align="stretch">
          <Button variant="primaryAction" type="submit" isDisabled={isEntity}>
            {t("Send request")}
          </Button>
          <Button variant={"primaryGhost"} onClick={modal.onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}

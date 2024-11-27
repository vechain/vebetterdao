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
import { useDelegateXNode } from "@/hooks/useDelegateXNode"
import { useCallback } from "react"
import { ExclamationTriangle, TransactionModal } from "@/components"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useSelectedGmNft } from "@/api"

type FormData = {
  walletAddress: string
}

export const DelegateXNodeModal = ({ modal }: { modal: UseDisclosureProps }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isXNodeAttachedToGM } = useSelectedGmNft()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>()

  const confirmationModal = useDisclosure()
  const delegatee = watch("walletAddress")
  const delegateXNode = useDelegateXNode({})
  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  const openConfirmationModal = useCallback(() => {
    confirmationModal.onOpen()
  }, [confirmationModal])

  const handleDelegate = useCallback(() => {
    delegateXNode.sendTransaction({ delegatee, isAttachedToGM: isXNodeAttachedToGM })
  }, [delegateXNode, delegatee, isXNodeAttachedToGM])

  const handleClose = useCallback(() => {
    modal.onClose?.()
    confirmationModal.onClose?.()
    delegateXNode.resetStatus()
    reset()
  }, [modal, confirmationModal, delegateXNode, reset])

  if (delegateXNode.status !== "ready") {
    return (
      <TransactionModal
        isOpen={modal.isOpen ?? false}
        onClose={handleClose}
        successTitle={t("XNode delegation completed!")}
        status={delegateXNode.status}
        errorDescription={delegateXNode.error?.reason}
        errorTitle={delegateXNode.error ? t("Error delegating XNode") : undefined}
        showTryAgainButton
        onTryAgain={() => delegateXNode.sendTransaction({ delegatee })}
        pendingTitle={t("Delegating XNode...")}
        showExplorerButton
        txId={delegateXNode.txReceipt?.meta.txID ?? delegateXNode.sendTransactionTx?.txid}
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
              {t("Are you sure you want to delegate your XNode?")}
            </Heading>
          </VStack>
          <VStack align="stretch">
            <Text fontWeight="600">{t("You're delegating it to")}</Text>
            <Text fontSize="sm">{delegatee}</Text>
          </VStack>
          <Alert status="warning" borderRadius="2xl">
            <AlertIcon w={9} h={9} />
            <Box lineHeight={"1.20rem"} fontSize="sm">
              <AlertTitle as="span">
                {t("The delegated address will be able to endorse and upgrade GM NFTs using your XNode")}
              </AlertTitle>
              <AlertDescription as="span">{t("but won't be able to transfer or sell your XNode.")}</AlertDescription>
              {isXNodeAttachedToGM && (
                <Text fontSize="sm" color="#C84968" fontWeight={600}>
                  {t("Notice: your GM NFT will be detached from your XNode.")}
                </Text>
              )}
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
        <Heading fontSize="2xl">{t("Delegate your XNode")}</Heading>
        <Box>
          <Text color="#6A6A6A" as="span">
            {t(
              "By delegating your XNode, another address will be able to endorse apps and upgrade GM NFTs using your XNode.",
            )}
          </Text>
          <Text color="#6A6A6A" as="span" fontWeight="600">
            {t("The delegatee won't be able to transfer or sell your XNode.")}
          </Text>
        </Box>
        <VStack align="stretch">
          <Heading fontSize="lg">{t("Who do you want to delegate to?")}</Heading>
          <FormControl isInvalid={!!errors.walletAddress}>
            <FormLabel color="#6A6A6A" fontSize="sm">
              {t("User wallet address")}
            </FormLabel>
            <Input
              {...register("walletAddress", {
                required: t("Wallet address is required"),
                validate: value =>
                  (isValid(value) && !compareAddresses(value, account ?? "")) ||
                  t("Please enter a valid wallet address"),
              })}
            />
            <FormErrorMessage>{errors.walletAddress && errors.walletAddress.message}</FormErrorMessage>
          </FormControl>
        </VStack>
        <VStack align="stretch">
          <Button variant="primaryAction" type="submit">
            {t("Delegate")}
          </Button>
          <Button variant={"primaryGhost"} onClick={modal.onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}

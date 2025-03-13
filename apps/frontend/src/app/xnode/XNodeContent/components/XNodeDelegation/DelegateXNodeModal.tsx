import { useXNode } from "@/api"
import { getIsNodeHolder } from "@/api/contracts/xNodes/useIsNodeHolder"
import { ExclamationTriangle, TransactionModal, TransactionModalStatus } from "@/components"
import { BaseModal } from "@/components/BaseModal"
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
  useDisclosure,
  UseDisclosureProps,
  VStack,
} from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { compareAddresses, isValid } from "@repo/utils/AddressUtils"
import { useWallet, useConnex, useVechainDomain } from "@vechain/vechain-kit"
import { useCallback } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

type FormData = {
  walletAddress: string
}

export const DelegateXNodeModal = ({ modal }: { modal: UseDisclosureProps }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { thor } = useConnex()
  const { isXNodeAttachedToGM } = useXNode()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setError,
  } = useForm<FormData>()

  const confirmationModal = useDisclosure()
  const delegateeAddressOrDomain = watch("walletAddress")
  const delegateXNode = useDelegateXNode({})
  const triangleSize = useBreakpointValue({ base: 100, md: 220 })
  const { data: vnsData } = useVechainDomain(delegateeAddressOrDomain)
  const delegateeDomain = vnsData?.domain
  const delegateeAddress = vnsData?.address

  const openConfirmationModal = useCallback(() => {
    confirmationModal.onOpen()
  }, [confirmationModal])

  const handleDelegate = useCallback(async () => {
    if (
      !delegateeDomain &&
      (!isValid(delegateeAddressOrDomain) || compareAddresses(delegateeAddressOrDomain, account?.address ?? ""))
    ) {
      setError("walletAddress", {
        type: "manual",
        message: t("Please enter a valid wallet address"),
      })
      return
    }
    const delegateeWalletAddress = delegateeAddress || delegateeAddressOrDomain
    try {
      const hasExistingXNode = await getIsNodeHolder(thor, delegateeWalletAddress)
      if (hasExistingXNode) {
        setError("walletAddress", {
          type: "manual",
          message: t("This address already has a Node. Please choose another address."),
        })
        return
      }
      delegateXNode.sendTransaction({ delegatee: delegateeWalletAddress, isAttachedToGM: isXNodeAttachedToGM })
    } catch (error) {
      console.error("Error checking node holder status:", error)
      setError("walletAddress", {
        type: "manual",
        message: t("Error checking node holder status. Please try again."),
      })
    }
  }, [
    delegateeDomain,
    delegateeAddress,
    delegateeAddressOrDomain,
    delegateXNode,
    account,
    isXNodeAttachedToGM,
    t,
    thor,
    setError,
  ])

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
        successTitle={t("Node delegation completed!")}
        status={delegateXNode.status as TransactionModalStatus}
        errorDescription={delegateXNode.error?.reason}
        errorTitle={delegateXNode.error ? t("Error delegating Node") : undefined}
        onTryAgain={() => delegateXNode.sendTransaction({ delegatee: delegateeAddressOrDomain })}
        pendingTitle={t("Delegating Node...")}
        showExplorerButton
        txId={delegateXNode.txReceipt?.meta.txID}
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
              {t("Are you sure you want to delegate your Node?")}
            </Heading>
          </VStack>
          <VStack align="stretch">
            <Text fontWeight="600">{t("You're delegating it to")}</Text>
            <Text fontSize="sm">{delegateeAddressOrDomain}</Text>
          </VStack>
          <Alert status="warning" borderRadius="2xl">
            <AlertIcon w={5} h={5} />
            <Box lineHeight={"1.20rem"} fontSize="sm">
              <AlertTitle as="span">
                {t("The delegated address will be able to endorse and upgrade GM NFTs using your Node")}
              </AlertTitle>
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
        <Heading fontSize="2xl">{t("Delegate your Node")}</Heading>
        <Box>
          <Text color="#6A6A6A" as="span">
            {t(
              "By delegating your Node, another address will be able to endorse apps and upgrade GM NFTs using your Node.",
            )}
          </Text>
          <Text color="#6A6A6A" as="span" fontWeight="600">
            {t("The delegatee won't be able to transfer or sell your Node.")}
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
          <Heading fontSize="lg">{t("Who do you want to delegate to?")}</Heading>
          <FormControl isInvalid={!!errors.walletAddress}>
            <FormLabel color="#6A6A6A" fontSize="sm">
              {t("User wallet address")}
            </FormLabel>
            <Input
              {...register("walletAddress", {
                required: t("Wallet address is required"),
                validate: async value => {
                  if (!isValid(value) || compareAddresses(value, account?.address ?? "")) {
                    return t("Please enter a valid wallet address")
                  }
                  try {
                    const hasExistingXNode = await getIsNodeHolder(thor, value)
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
            <FormErrorMessage>{errors.walletAddress && errors.walletAddress.message}</FormErrorMessage>
          </FormControl>
        </VStack>
        <VStack align="stretch">
          <Button variant="primaryAction" type="button" onClick={handleDelegate}>
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

import { TransactionModal } from "@/components"
import { BaseModal } from "@/components/BaseModal"
import { useLinkEntityToPassport } from "@/hooks/useLinkEntityToPassport"
import {
  UseDisclosureReturn,
  VStack,
  Heading,
  Box,
  Text,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
} from "@chakra-ui/react"
import { UilLink } from "@iconscout/react-unicons"
import { isValid } from "@repo/utils/AddressUtils"
import { useCallback } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

type FormData = {
  accountToConnect: string
}

export const LinkAccountModal = ({ modal }: { modal: UseDisclosureReturn }) => {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>()

  const accountToConnect = watch("accountToConnect")

  const linkEntityToPassport = useLinkEntityToPassport({})

  const handleClose = useCallback(() => {
    modal.onClose?.()
    linkEntityToPassport.resetStatus()
    reset()
  }, [modal, linkEntityToPassport, reset])

  if (linkEntityToPassport.status !== "ready") {
    return (
      <TransactionModal
        isOpen={modal.isOpen ?? false}
        onClose={handleClose}
        successTitle={t("Account linked successfully!")}
        status={linkEntityToPassport.status}
        errorDescription={linkEntityToPassport.error?.reason}
        errorTitle={linkEntityToPassport.error ? t("Error linking account") : undefined}
        showTryAgainButton
        onTryAgain={() => linkEntityToPassport.sendTransaction({ passport: accountToConnect })}
        pendingTitle={t("Linking account...")}
        showExplorerButton
        txId={linkEntityToPassport.txReceipt?.meta.txID ?? linkEntityToPassport.sendTransactionTx?.txid}
      />
    )
  }

  const onSubmit = (data: FormData) => {
    linkEntityToPassport.sendTransaction({ passport: data.accountToConnect })
  }

  return (
    <BaseModal isOpen={modal.isOpen} onClose={modal.onClose}>
      <VStack align="stretch" gap={6} as="form" onSubmit={handleSubmit(onSubmit)}>
        <UilLink color="#004CFC" size={"3rem"} />
        <Heading fontSize="2xl">{t("Link a Primary Account")}</Heading>
        <Box>
          <Text color="#6A6A6A" as="span">
            {t(
              "By linking this account, all Better Actions will be transferred to the Primary Account, which will also hold exclusive voting power. The Primary Account must approve the link request first.",
            )}
          </Text>
          <Text color="#6A6A6A" as="span" fontWeight="600">
            {t("You will only be able to vote from your Primary account.")}
          </Text>
        </Box>
        <VStack align="stretch">
          <Heading fontSize="lg">{t("What account do you want to link?")}</Heading>
          <FormControl isInvalid={!!errors.accountToConnect}>
            <FormLabel color="#6A6A6A" fontSize="sm">
              {t("Wallet address")}
            </FormLabel>
            <Input
              {...register("accountToConnect", {
                required: t("Account address is required"),
                validate: value => isValid(value) || t("Please enter a valid wallet address"),
              })}
            />
            <FormErrorMessage>{errors.accountToConnect && errors.accountToConnect.message}</FormErrorMessage>
          </FormControl>
        </VStack>
        <VStack align="stretch">
          <Button variant="primaryAction" type="submit">
            {t("Link this account")}
          </Button>
          <Button variant={"primaryGhost"} onClick={modal.onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}

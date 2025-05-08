import { WalletAddressInput } from "@/app/components/Input"
import { BaseModal } from "@/components/BaseModal"
import { useLinkEntityToPassport } from "@/hooks/useLinkEntityToPassport"
import { UseDisclosureReturn, VStack, Heading, Box, Text, FormControl, FormLabel, Button } from "@chakra-ui/react"
import { UilLink } from "@iconscout/react-unicons"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { useCallback } from "react"
type FormData = {
  accountToConnect: string
}

export const LinkAccountModal = ({ modal }: { modal: UseDisclosureReturn }) => {
  const { t } = useTranslation()
  const { handleSubmit, setValue, watch } = useForm<FormData>()
  const { isTxModalOpen } = useTransactionModal()
  const accountToConnect = watch("accountToConnect")
  const { isOpen = false, onClose } = modal

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  const linkEntityToPassport = useLinkEntityToPassport({
    onSuccess: handleClose,
  })

  const onSubmit = (data: FormData) => {
    linkEntityToPassport.sendTransaction({ passport: data.accountToConnect })
  }

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={handleClose}>
      <VStack align="stretch" gap={6} as="form" onSubmit={handleSubmit(onSubmit)}>
        <UilLink color="#004CFC" size={"3rem"} />
        <Heading fontSize="2xl">{t("Become a secondary account")}</Heading>
        <Box>
          <Text color="#6A6A6A" as="span">
            {t(
              "By linking this account to a primary account, all your future better actions will be transferred to it, which will also hold exclusive voting power.",
            )}
          </Text>
        </Box>
        <VStack align="stretch">
          <Heading fontSize="lg">{t("Which Primary Account would you like to link to?")}</Heading>
          <FormControl isInvalid={!accountToConnect}>
            <FormLabel color="#6A6A6A" fontSize="sm">
              {t("Wallet address")}
            </FormLabel>
            <WalletAddressInput onAddressResolved={address => setValue("accountToConnect", address ?? "")} />
          </FormControl>
        </VStack>
        <VStack align="stretch">
          <Button variant="primaryAction" type="submit">
            {t("Send link request")}
          </Button>
          <Button variant={"primaryGhost"} onClick={modal.onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}

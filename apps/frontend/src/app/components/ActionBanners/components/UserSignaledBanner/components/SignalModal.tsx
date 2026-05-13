import { UseDisclosureProps, VStack, Text, Heading, Button } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { SignalEvent } from "@/api/contracts/xApps/hooks/useUserSignalEvents"
import { BaseModal } from "@/components/BaseModal"

import { SignalCard } from "./SignalCard"

type Props = {
  open: UseDisclosureProps["open"]
  onClose: UseDisclosureProps["onClose"]
  signals: (SignalEvent & { appName: string })[]
}
export const SignalModal = ({ open, onClose, signals }: Props) => {
  const { t } = useTranslation()
  return (
    <BaseModal isOpen={open || false} onClose={onClose || (() => {})}>
      <VStack align="stretch" gap={4}>
        <Heading size="md">{t("You have been signalled")}</Heading>
        <Text color="text.subtle">
          {t(
            "To be able to participate in the VeBetter DAO, you need to have a good reputation. Signals are a way for the apps to let you know if you are not meeting the standards.",
          )}
        </Text>
        <Text color="text.subtle">
          {t(
            "If you believe this signal is unfair, please reach out to the app that signalled you to resolve the issue or you can file an appeal by clicking on the button below.",
          )}
        </Text>
        <Button asChild variant="primary" size="md" alignSelf="stretch">
          <NextLink href="/appeal">{t("File an appeal")}</NextLink>
        </Button>
        {signals.map(signal => (
          <SignalCard key={signal.appId} appName={signal.appName} reason={signal.reason} />
        ))}
      </VStack>
    </BaseModal>
  )
}

import { BaseModal } from "@/components/BaseModal"
import { UseDisclosureProps, VStack, Text, Heading, Button, Link } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { SignalCard } from "./SignalCard"
import { SignalEvent } from "@/api/contracts/xApps/hooks/useUserSignalEvents"

type Props = {
  isOpen: UseDisclosureProps["isOpen"]
  onClose: UseDisclosureProps["onClose"]
  signals: (SignalEvent & { appName: string })[]
}

export const SignalModal = ({ isOpen, onClose, signals }: Props) => {
  const { t } = useTranslation()

  return (
    <BaseModal isOpen={isOpen || false} onClose={onClose || (() => {})}>
      <VStack align="stretch" spacing={4}>
        <Heading size="md">{t("You have been signalled")}</Heading>
        <Text color="#6A6A6A" fontWeight={400}>
          {t(
            "To be able to participate in the VeBetter DAO, you need to have a good reputation. Signals are a way for the apps to let you know if you are not meeting the standards.",
          )}
        </Text>

        <Text color="#6A6A6A" fontWeight={400}>
          {t(
            "If you believe this signal is unfair, please reach out to the app that signalled you to resolve the issue or you can file an appeal by clicking on the button below.",
          )}
        </Text>

        <Button as={Link} href="/appeal" colorScheme="blue" borderRadius="full" width="">
          {t("File an appeal")}
        </Button>

        {signals.map(signal => (
          <SignalCard key={signal.appId} appName={signal.appName} reason={signal.reason} />
        ))}
      </VStack>
    </BaseModal>
  )
}

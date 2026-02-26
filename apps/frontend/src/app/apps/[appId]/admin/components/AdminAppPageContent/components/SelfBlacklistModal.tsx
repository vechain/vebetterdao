import { Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useSelfBlacklistApp } from "@/hooks/xApp/useSelfBlacklistApp"

import { BaseModal } from "../../../../../../../components/BaseModal"
import { useCurrentAppInfo } from "../../../../hooks/useCurrentAppInfo"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const SelfBlacklistModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { app } = useCurrentAppInfo()
  const { sendTransaction } = useSelfBlacklistApp(app?.id || "", () => {
    onClose()
    router.push("/apps")
  })

  const handleSubmit = useCallback(() => {
    sendTransaction()
  }, [sendTransaction])

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton>
      <VStack align="stretch" gap={6}>
        <VStack align="stretch" gap={2}>
          <Heading size="2xl">{t("Blacklist app")}</Heading>
          <Text color="text.subtle" textStyle="sm">
            {t(
              "This will permanently remove your app from VeBetterDAO. Your app will no longer be eligible for voting rounds or reward allocations.",
            )}
          </Text>
        </VStack>

        <HStack rounded="xl" bg="status.negative.subtle" p={4} color="status.negative.primary" gap={3}>
          <UilInfoCircle size="24px" />
          <Text textStyle="sm" fontWeight="semibold">
            {t("This action is irreversible. Your app will be blacklisted permanently.")}
          </Text>
        </HStack>

        <Button variant="outline" colorPalette="red" onClick={handleSubmit}>
          {t("Blacklist app")}
        </Button>
      </VStack>
    </BaseModal>
  )
}

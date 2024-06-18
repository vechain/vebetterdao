import { CustomModalContent, ExclamationTriangle } from "@/components"
import { Button, Divider, Heading, Modal, ModalBody, ModalOverlay, Text, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../AdminAppPageContent"
import { useCurrentAppAdmin } from "@/app/apps/[appId]/hooks"
import { useCallback } from "react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useCurrentAppInfo } from "@/app/apps/[appId]/hooks/useCurrentAppInfo"

type Props = {
  onClose: () => void
  isOpen: boolean
  form: UseFormReturn<AdminAppForm, any, undefined>
  onSubmit: () => void
  isAdminAddressChanged: boolean
  isTeamWalletAddressChanged: boolean
}

export const UpdateConfirmationModal = ({
  onClose,
  isOpen,
  onSubmit,
  form,
  isAdminAddressChanged,
  isTeamWalletAddressChanged,
}: Props) => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { admin } = useCurrentAppAdmin()
  const handleSubmit = useCallback(() => {
    onSubmit()
    onClose()
  }, [onClose, onSubmit])
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalBody p={"40px"}>
          <VStack align="center" gap="20px">
            <ExclamationTriangle color="#D23F63" size={230} />
            <Heading fontSize="28px" fontWeight={700}>
              {t("Just to be sure, you’re updating:")}
            </Heading>
            {isTeamWalletAddressChanged && (
              <VStack align="stretch" gap={4} alignSelf={"stretch"}>
                <VStack align="stretch">
                  <Text fontWeight={600}>{t("OLD team wallet address")}</Text>
                  <Text fontSize={"14px"} textDecorationLine={"line-through"} color={"#979797"}>
                    {humanAddress(app?.teamWalletAddress || "", 6, 4)}
                  </Text>
                </VStack>
                <VStack align="stretch">
                  <Text fontWeight={600}>{t("NEW team wallet address")}</Text>
                  <Text fontSize={"14px"}>{humanAddress(form.getValues("teamWalletAddress"), 6, 4)}</Text>
                </VStack>
              </VStack>
            )}
            {isTeamWalletAddressChanged && isAdminAddressChanged && <Divider />}
            {isAdminAddressChanged && (
              <VStack align="stretch" gap={4} alignSelf={"stretch"}>
                <VStack align="stretch">
                  <Text fontWeight={600}>{t("OLD admin address")}</Text>
                  <Text fontSize={"14px"} textDecorationLine={"line-through"} color={"#979797"}>
                    {humanAddress(admin || "", 6, 4)}
                  </Text>
                </VStack>
                <VStack align="stretch">
                  <Text fontWeight={600}>{t("NEW admin address")}</Text>
                  <Text fontSize={"14px"}>{humanAddress(form.getValues("adminAddress"), 6, 4)}</Text>
                </VStack>
              </VStack>
            )}

            <VStack align="center" gap="20px" mt={"20px"}>
              <Button variant="primaryAction" onClick={onClose}>
                {t("No, go back")}
              </Button>
              <Button variant="dangerGhost" onClick={handleSubmit}>
                {t("Yes, I'm sure")}
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}

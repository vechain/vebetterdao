import { Box, Button, HStack, Heading, Dialog, Text, VStack, Separator, useBreakpointValue } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useCallback } from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useCurrentAppInfo } from "@/app/apps/[appId]/hooks/useCurrentAppInfo"

import { CustomModalContent } from "../../../../../../../components/CustomModalContent"
import { ExclamationTriangle } from "../../../../../../../components/Icons/ExclamationTriangle"
import { useCurrentAppAdmin } from "../../../../hooks/useCurrentAppAdmin"
import { AdminAppForm } from "../AdminAppPageContent"

type Props = {
  onClose: () => void
  open: boolean
  form: UseFormReturn<AdminAppForm, any, AdminAppForm>
  onSubmit: () => void
  isAdminAddressChanged: boolean
  isTeamWalletAddressChanged: boolean
}
export const UpdateConfirmationModal = ({
  onClose,
  open,
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
  const oldTeamWalletAddress = useBreakpointValue({
    base: humanAddress(app?.teamWalletAddress || "", 6, 4),
    sm: humanAddress(app?.teamWalletAddress || "", 10, 12),
  })
  const newTeamWalletAddress = useBreakpointValue({
    base: humanAddress(form.getValues("teamWalletAddress"), 6, 4),
    sm: humanAddress(form.getValues("teamWalletAddress"), 10, 12),
  })
  const oldAdminAddress = useBreakpointValue({
    base: humanAddress(admin || "", 6, 4),
    sm: humanAddress(admin || "", 10, 12),
  })
  const newAdminAddress = useBreakpointValue({
    base: humanAddress(form.getValues("adminAddress"), 6, 4),
    sm: humanAddress(form.getValues("adminAddress"), 10, 12),
  })
  return (
    <Dialog.Root
      open={open}
      onOpenChange={details => {
        if (!details.open) {
          onClose()
        }
      }}
      size={"xl"}>
      <CustomModalContent>
        <Dialog.Body px="40px" py="20px">
          <VStack align="center" gap="20px">
            <ExclamationTriangle color="#D23F63" size={useBreakpointValue({ base: 100, sm: 180 })} />
            <Heading size={["xl", "3xl"]} textAlign={"center"}>
              {t("Just to be sure, you’re updating:")}
            </Heading>
            {isTeamWalletAddressChanged && (
              <VStack align="stretch" gap={4} alignSelf={"stretch"}>
                <VStack align="stretch">
                  <Text fontWeight="semibold">{t("Treasury address")}</Text>
                  <HStack>
                    <Text textStyle={"sm"} textDecorationLine={"line-through"} color={"#979797"}>
                      {oldTeamWalletAddress}
                    </Text>
                    <Text>{t("→")}</Text>
                    <Text textStyle={"sm"}>{newTeamWalletAddress}</Text>
                  </HStack>
                </VStack>
              </VStack>
            )}
            {isTeamWalletAddressChanged && isAdminAddressChanged && <Separator />}
            {isAdminAddressChanged && (
              <VStack align="stretch" gap={4} alignSelf={"stretch"}>
                <VStack align="stretch">
                  <Text fontWeight="semibold">{t("Admin address")}</Text>
                  <HStack>
                    <Text textStyle={"sm"} textDecorationLine={"line-through"} color={"#979797"}>
                      {oldAdminAddress}
                    </Text>
                    <Text>{t("→")}</Text>
                    <Text textStyle={"sm"}>{newAdminAddress}</Text>
                  </HStack>
                </VStack>
                <HStack rounded="16px" bg="#FCEEF1" p="16px 12px" color="#D23F63">
                  <Box>
                    <UilInfoCircle color="#D23F63" size="36px" />
                  </Box>
                  <Box display={"inline-block"}>
                    <Text as="span" textStyle="sm" fontWeight="semibold">
                      {t("You will not be able to manage the app anymore.")}
                    </Text>

                    <Text hideBelow="md" as="span" textStyle="sm">
                      {t("This change is applied when the new address logs in.")}
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            )}

            <VStack alignItems="center" gap="20px" mt={"20px"}>
              <Button variant="primary" onClick={onClose}>
                {t("No, go back")}
              </Button>
              <Button variant="ghost" color="status.negative.primary" onClick={handleSubmit}>
                {t("Yes, I'm sure")}
              </Button>
            </VStack>
          </VStack>
        </Dialog.Body>
      </CustomModalContent>
    </Dialog.Root>
  )
}

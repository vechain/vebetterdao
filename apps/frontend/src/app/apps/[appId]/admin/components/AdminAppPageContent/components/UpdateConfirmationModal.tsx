import { CustomModalContent, ExclamationTriangle } from "@/components"
import {
  Box,
  Button,
  HStack,
  Heading,
  Dialog,
  Show,
  Text,
  VStack,
  Separator,
  useBreakpointValue,
  useMediaQuery,
} from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../AdminAppPageContent"
import { useCurrentAppAdmin } from "@/app/apps/[appId]/hooks"
import { useCallback } from "react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useCurrentAppInfo } from "@/app/apps/[appId]/hooks/useCurrentAppInfo"
import { UilInfoCircle } from "@iconscout/react-unicons"

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
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])

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
      <Dialog.Backdrop />
      <CustomModalContent>
        <Dialog.Body px="40px" py="20px">
          <VStack align="center" gap="20px">
            <ExclamationTriangle color="#D23F63" size={useBreakpointValue({ base: 100, sm: 180 })} />
            <Heading fontSize={["22px", "28px"]} fontWeight={700} textAlign={"center"}>
              {t("Just to be sure, you’re updating:")}
            </Heading>
            {isTeamWalletAddressChanged && (
              <VStack align="stretch" gap={4} alignSelf={"stretch"}>
                <VStack align="stretch">
                  <Text fontWeight={600}>{t("Treasury address")}</Text>
                  <HStack>
                    <Text fontSize={"14px"} textDecorationLine={"line-through"} color={"#979797"}>
                      {oldTeamWalletAddress}
                    </Text>
                    <Text>{t("→")}</Text>
                    <Text fontSize={"14px"}>{newTeamWalletAddress}</Text>
                  </HStack>
                </VStack>
              </VStack>
            )}
            {isTeamWalletAddressChanged && isAdminAddressChanged && <Separator />}
            {isAdminAddressChanged && (
              <VStack align="stretch" gap={4} alignSelf={"stretch"}>
                <VStack align="stretch">
                  <Text fontWeight={600}>{t("Admin address")}</Text>
                  <HStack>
                    <Text fontSize={"14px"} textDecorationLine={"line-through"} color={"#979797"}>
                      {oldAdminAddress}
                    </Text>
                    <Text>{t("→")}</Text>
                    <Text fontSize={"14px"}>{newAdminAddress}</Text>
                  </HStack>
                </VStack>
                <HStack rounded="16px" bg="#FCEEF1" p="16px 12px" color="#D23F63">
                  <Box>
                    <UilInfoCircle color="#D23F63" size="36px" />
                  </Box>
                  <Box display={"inline-block"}>
                    <Text as="span" fontSize="14px" fontWeight={600}>
                      {t("You will not be able to manage the app anymore.")}
                    </Text>
                    <Show when={isAbove800}>
                      <Text as="span" fontSize="14px">
                        {t("This change is applied when the new address logs in.")}
                      </Text>
                    </Show>
                  </Box>
                </HStack>
              </VStack>
            )}

            <VStack alignItems="center" gap="20px" mt={"20px"}>
              <Button variant="primaryAction" onClick={onClose}>
                {t("No, go back")}
              </Button>
              <Button variant="dangerGhost" onClick={handleSubmit}>
                {t("Yes, I'm sure")}
              </Button>
            </VStack>
          </VStack>
        </Dialog.Body>
      </CustomModalContent>
    </Dialog.Root>
  )
}

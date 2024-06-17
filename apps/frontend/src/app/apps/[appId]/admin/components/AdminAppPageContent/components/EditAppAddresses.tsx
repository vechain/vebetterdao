import { Input, Text, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../AdminAppPageContent"
import { useCurrentAppAdmin } from "@/app/apps/[appId]/hooks"
import { useCurrentAppInfo } from "@/app/apps/[appId]/hooks/useCurrentAppInfo"

type Props = {
  form: UseFormReturn<AdminAppForm>
}

export const EditAppAddresses = ({ form }: Props) => {
  const { t } = useTranslation()
  const { admin } = useCurrentAppAdmin()
  const { app } = useCurrentAppInfo()

  return (
    <VStack align="stretch" gap="32px">
      <Text color="#D23F63" fontSize={"24px"} fontWeight={700}>
        {t("Sensitive parameters")}
      </Text>
      <VStack align="stretch">
        <Text fontSize="14px">{t("Allocation receiver address")}</Text>
        <Input {...form.register("allocationReceiverAddress")} defaultValue={app?.receiverAddress}></Input>
      </VStack>
      <VStack align="stretch">
        <Text fontSize="14px">{t("Admin address")}</Text>
        <Input {...form.register("adminAddress")} defaultValue={admin}></Input>
      </VStack>
    </VStack>
  )
}

import { FormControl, FormErrorMessage, Input, Text, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../AdminAppPageContent"
import { useCurrentAppAdmin } from "@/app/apps/[appId]/hooks"
import { useCurrentAppInfo } from "@/app/apps/[appId]/hooks/useCurrentAppInfo"
import { isValid } from "@repo/utils/AddressUtils"

type Props = {
  form: UseFormReturn<AdminAppForm>
}

export const EditAppAddresses = ({ form }: Props) => {
  const { t } = useTranslation()
  const { admin } = useCurrentAppAdmin()
  const { app } = useCurrentAppInfo()
  const { errors } = form.formState

  return (
    <VStack align="stretch" gap="32px">
      <Text color="#D23F63" fontSize={"24px"} fontWeight={700}>
        {t("Sensitive parameters")}
      </Text>
      <VStack align="stretch">
        <Text fontSize="14px">{t("Allocation team address")}</Text>
        <FormControl isInvalid={!!errors.teamWalletAddress}>
          <Input
            {...form.register("teamWalletAddress", {
              required: {
                value: true,
                message: t("Address required"),
              },
              validate: value => isValid(value) || t("Invalid address"),
            })}
            defaultValue={app?.teamWalletAddress}></Input>
          <FormErrorMessage>{errors.teamWalletAddress?.message}</FormErrorMessage>
        </FormControl>
      </VStack>
      <VStack align="stretch">
        <Text fontSize="14px">{t("Admin address")}</Text>
        <FormControl isInvalid={!!errors.adminAddress}>
          <Input
            {...form.register("adminAddress", {
              required: {
                value: true,
                message: t("Address required"),
              },
              validate: value => isValid(value) || t("Invalid address"),
            })}
            defaultValue={admin}></Input>
          <FormErrorMessage>{errors.adminAddress?.message}</FormErrorMessage>
        </FormControl>
      </VStack>
    </VStack>
  )
}

import { Heading, Text, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../AdminAppPageContent"
import { AddSignalerButton } from "./components/AddSignalerButton"
import { useCallback } from "react"
import { SignalerItem } from "./components/SignalerItem"

interface Props {
  form: UseFormReturn<AdminAppForm>
}
export const EditAppSignalers = ({ form }: Props) => {
  const { t } = useTranslation()
  const signalers = form.watch("signalers")

  const handleDeleteSignaler = useCallback(
    (index: number) => () =>
      form.setValue(
        "signalers",
        signalers.filter((_, i) => i !== index),
      ),
    [form, signalers],
  )

  return (
    <VStack align="stretch">
      <Heading fontSize={"24px"} fontWeight={700}>
        {t("Signalers")}
      </Heading>
      <Text color="#6A6A6A">
        {t("These users will have the ability to bot-signal and reset signal counts for individual users.")}
      </Text>
      <VStack align="stretch" gap={4} my={4}>
        {signalers?.map((signaler, index) => (
          <SignalerItem key={signaler} signaler={signaler} handleDeleteSignaler={handleDeleteSignaler(index)} />
        ))}
      </VStack>
      <AddSignalerButton editAdminForm={form} />
    </VStack>
  )
}

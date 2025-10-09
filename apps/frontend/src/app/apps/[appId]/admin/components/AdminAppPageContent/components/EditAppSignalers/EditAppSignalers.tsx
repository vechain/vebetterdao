import { Heading, Text, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AdminAppForm } from "../../AdminAppPageContent"

import { SignalerItem } from "./components/SignalerItem"
import { AddSignalerButton } from "./components/AddSignalerButton"

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
      <Heading size="2xl">{t("Signalers")}</Heading>
      <Text color="text.subtle">
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

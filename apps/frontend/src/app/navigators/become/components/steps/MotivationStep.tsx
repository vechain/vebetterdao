import { Field, Heading, Text, Textarea, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"

export const MotivationStep = () => {
  const { t } = useTranslation()
  const { data, setData } = useNavigatorApplicationStore()

  return (
    <VStack gap={5} align="stretch" w="full">
      <VStack gap={1} align="start">
        <Heading size="md">{t("Motivation and Qualifications")}</Heading>
        <Text textStyle="md" color="fg.muted">
          {t("Share with the community why you want to become a navigator and your qualifications.")}
        </Text>
      </VStack>

      <Field.Root required>
        <Field.Label>{t("How will you decide which apps to vote for and how to vote on proposals?")}</Field.Label>
        <Textarea
          placeholder={t("My voting strategy will focus on...")}
          value={data.votingStrategy}
          onChange={e => setData({ votingStrategy: e.target.value })}
          rows={4}
          maxLength={1000}
        />
      </Field.Root>

      <Field.Root required>
        <Field.Label>{t("Why do you want to become a navigator?")}</Field.Label>
        <Textarea
          placeholder={t("My motivation for becoming a navigator is...")}
          value={data.motivation}
          onChange={e => setData({ motivation: e.target.value })}
          rows={4}
          maxLength={1000}
        />
      </Field.Root>

      <Field.Root required>
        <Field.Label>{t("What experience do you have with VeBetterDAO and governance?")}</Field.Label>
        <Textarea
          placeholder={t("I have been active in VeBetterDAO for...")}
          value={data.qualifications}
          onChange={e => setData({ qualifications: e.target.value })}
          rows={4}
          maxLength={1000}
        />
      </Field.Root>
    </VStack>
  )
}

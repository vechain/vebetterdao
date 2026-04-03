import { Field, Heading, Text, Textarea, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"

export const MotivationStep = () => {
  const { t } = useTranslation()
  const { data, setData } = useNavigatorApplicationStore()

  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="md">{t("Why do you want to be a Navigator?")}</Heading>
        <Text textStyle="sm" color="fg.muted">
          {t(
            "Help the community understand your motivation and qualifications. This information will be stored on IPFS and publicly visible.",
          )}
        </Text>
      </VStack>

      <Field.Root required>
        <Field.Label>{t("Motivation")}</Field.Label>
        <Textarea
          placeholder={t("I want to become a navigator because...")}
          value={data.motivation}
          onChange={e => setData({ motivation: e.target.value })}
          rows={4}
          maxLength={1000}
        />
        <Field.HelperText>{t("Why do you want to become a voting delegate?")}</Field.HelperText>
      </Field.Root>

      <Field.Root required>
        <Field.Label>{t("Qualifications")}</Field.Label>
        <Textarea
          placeholder={t("I have been active in VeBetterDAO for...")}
          value={data.qualifications}
          onChange={e => setData({ qualifications: e.target.value })}
          rows={4}
          maxLength={1000}
        />
        <Field.HelperText>{t("What experience do you have with VeBetterDAO and governance?")}</Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>{t("Voting Strategy")}</Field.Label>
        <Textarea
          placeholder={t("My voting strategy will focus on...")}
          value={data.votingStrategy}
          onChange={e => setData({ votingStrategy: e.target.value })}
          rows={4}
          maxLength={1000}
        />
        <Field.HelperText>
          {t("How will you decide which apps to vote for and how to vote on proposals?")}
        </Field.HelperText>
      </Field.Root>
    </VStack>
  )
}

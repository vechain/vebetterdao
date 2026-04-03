import { Field, Heading, Input, Text, Textarea, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"

export const SocialsStep = () => {
  const { t } = useTranslation()
  const { data, setData } = useNavigatorApplicationStore()

  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="md">{t("Social Profiles")}</Heading>
        <Text textStyle="sm" color="fg.muted">
          {t(
            "Help citizens verify your identity and follow your activity. At least one social profile is recommended.",
          )}
        </Text>
      </VStack>

      <Field.Root>
        <Field.Label>{t("Twitter / X")}</Field.Label>
        <Input
          placeholder={t("vebetterdao")}
          value={data.twitterHandle}
          onChange={e => setData({ twitterHandle: e.target.value })}
        />
        <Field.HelperText>{t("Your Twitter handle (without @)")}</Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>{t("Discord")}</Field.Label>
        <Input
          placeholder={t("username#1234")}
          value={data.discordHandle}
          onChange={e => setData({ discordHandle: e.target.value })}
        />
        <Field.HelperText>{t("Your Discord username")}</Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>{t("Website")}</Field.Label>
        <Input
          placeholder={t("https://mywebsite.com")}
          value={data.websiteUrl}
          onChange={e => setData({ websiteUrl: e.target.value })}
        />
        <Field.HelperText>{t("Personal website or blog")}</Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>{t("Other links")}</Field.Label>
        <Textarea
          placeholder={t("https://github.com/myuser\nhttps://linkedin.com/in/myprofile")}
          value={data.otherLinks}
          onChange={e => setData({ otherLinks: e.target.value })}
          rows={3}
        />
        <Field.HelperText>{t("GitHub, LinkedIn, forum profile, etc.")}</Field.HelperText>
      </Field.Root>
    </VStack>
  )
}

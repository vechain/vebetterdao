import { Field, Heading, HStack, Input, Switch, Text, Textarea, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"

const ToggleField = ({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) => (
  <HStack justify="space-between" w="full">
    <Text textStyle="sm">{label}</Text>
    <Switch.Root checked={checked} onCheckedChange={e => onCheckedChange(e.checked)} colorPalette="blue" size="sm">
      <Switch.HiddenInput />
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch.Root>
  </HStack>
)

export const DisclosuresStep = () => {
  const { t } = useTranslation()
  const { data, setData } = useNavigatorApplicationStore()

  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="md">{t("Disclosures")}</Heading>
        <Text textStyle="sm" color="fg.muted">
          {t(
            "Transparency is key. Citizens should know about any potential conflicts of interest before delegating to you. All disclosures are public.",
          )}
        </Text>
      </VStack>

      <VStack gap={2} align="stretch">
        <ToggleField
          label={t("Are you affiliated with any VeBetterDAO app?")}
          checked={data.isAppAffiliated}
          onCheckedChange={checked => setData({ isAppAffiliated: checked })}
        />
        {data.isAppAffiliated && (
          <Field.Root>
            <Field.Label>{t("App names")}</Field.Label>
            <Input
              placeholder={t("e.g. Mugshot, GreenCart")}
              value={data.affiliatedAppNames}
              onChange={e => setData({ affiliatedAppNames: e.target.value })}
              size="sm"
            />
            <Field.HelperText>{t("List the apps you are affiliated with")}</Field.HelperText>
          </Field.Root>
        )}
      </VStack>

      <VStack gap={2} align="stretch">
        <ToggleField
          label={t("Are you a VeChain Foundation member or employee?")}
          checked={data.isFoundationMember}
          onCheckedChange={checked => setData({ isFoundationMember: checked })}
        />
        {data.isFoundationMember && (
          <Field.Root>
            <Field.Label>{t("Role")}</Field.Label>
            <Input
              placeholder={t("e.g. Developer Relations")}
              value={data.foundationRole}
              onChange={e => setData({ foundationRole: e.target.value })}
              size="sm"
            />
            <Field.HelperText>{t("What is your role at the foundation?")}</Field.HelperText>
          </Field.Root>
        )}
      </VStack>

      <VStack gap={2} align="stretch">
        <ToggleField
          label={t("Do you have any other conflicts of interest to disclose?")}
          checked={data.hasConflictsOfInterest}
          onCheckedChange={checked => setData({ hasConflictsOfInterest: checked })}
        />
        {data.hasConflictsOfInterest && (
          <Field.Root>
            <Field.Label>{t("Description")}</Field.Label>
            <Textarea
              placeholder={t("Describe any conflicts...")}
              value={data.conflictsDescription}
              onChange={e => setData({ conflictsDescription: e.target.value })}
              rows={3}
              maxLength={500}
              size="sm"
            />
          </Field.Root>
        )}
      </VStack>

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

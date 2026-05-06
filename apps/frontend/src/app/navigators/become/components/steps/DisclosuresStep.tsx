import { Field, Heading, HStack, Input, Switch, Text, Textarea, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"

export const isValidUrl = (url: string) => /^https?:\/\/.+\..+/.test(url)

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
          <Field.Root required>
            <Field.Label>{t("Apps")}</Field.Label>
            <Input
              placeholder={t("e.g. Mugshot, Owner of GreenCart")}
              value={data.affiliatedAppNames}
              onChange={e => setData({ affiliatedAppNames: e.target.value })}
              size="sm"
              maxLength={200}
            />
            <Field.HelperText ms="auto">{`${data.affiliatedAppNames.length}/200`}</Field.HelperText>
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
          <Field.Root required>
            <Field.Label>{t("Role")}</Field.Label>
            <Input
              placeholder={t("e.g. Developer Relations")}
              value={data.foundationRole}
              onChange={e => setData({ foundationRole: e.target.value })}
              size="sm"
              maxLength={200}
            />
            <Field.HelperText ms="auto">{`${data.foundationRole.length}/200`}</Field.HelperText>
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
          <Field.Root required>
            <Field.Label>{t("Description")}</Field.Label>
            <Textarea
              placeholder={t("Describe any conflicts...")}
              value={data.conflictsDescription}
              onChange={e => setData({ conflictsDescription: e.target.value })}
              rows={3}
              maxLength={500}
              size="sm"
            />
            <Field.HelperText ms="auto">{`${data.conflictsDescription.length}/500`}</Field.HelperText>
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
          onChange={e => {
            const sanitized = e.target.value.replace(/[^a-zA-Z0-9_]/g, "")
            setData({ twitterHandle: sanitized })
          }}
          maxLength={15}
        />
        <Field.HelperText>{t("Your Twitter handle (without @)")}</Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>{t("Discord")}</Field.Label>
        <Input
          placeholder={t("username")}
          value={data.discordHandle}
          onChange={e => {
            const sanitized = e.target.value.replace(/[^a-zA-Z0-9._]/g, "")
            setData({ discordHandle: sanitized })
          }}
          maxLength={32}
        />
      </Field.Root>

      <Field.Root invalid={data.websiteUrl.length > 0 && !isValidUrl(data.websiteUrl)}>
        <Field.Label>{t("Personal website or blog")}</Field.Label>
        <Input
          placeholder={t("https://mywebsite.com")}
          value={data.websiteUrl}
          onChange={e => setData({ websiteUrl: e.target.value.trim() })}
          maxLength={200}
        />
        <Field.ErrorText>{t("Must be a valid URL starting with https://")}</Field.ErrorText>
      </Field.Root>
    </VStack>
  )
}

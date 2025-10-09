import { Heading, Text, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AdminAppForm } from "../../AdminAppPageContent"

import { ModeratorItem } from "./components/ModeratorItem"
import { AddModeratorButton } from "./components/AddModeratorButton"

interface Props {
  form: UseFormReturn<AdminAppForm>
}
export const EditAppModerators = ({ form }: Props) => {
  const { t } = useTranslation()
  const moderators = form.watch("moderators")
  const handleDeleteModerator = useCallback(
    (index: number) => () =>
      form.setValue(
        "moderators",
        moderators.filter((_, i) => i !== index),
      ),
    [form, moderators],
  )
  return (
    <VStack align="stretch">
      <Heading size="2xl">{t("Moderators")}</Heading>
      <Text color="text.subtle">
        {t("These users will be able to manage the information in the feed and update the visual data on the profile.")}
      </Text>
      <VStack align="stretch" gap={4} my={4}>
        {moderators?.map((moderator, index) => (
          <ModeratorItem key={moderator} moderator={moderator} handleDeleteModerator={handleDeleteModerator(index)} />
        ))}
      </VStack>
      <AddModeratorButton editAdminForm={form} />
    </VStack>
  )
}

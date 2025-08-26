import { Heading, Text, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../AdminAppPageContent"
import { AddModeratorButton } from "./components/AddModeratorButton"
import { useCallback } from "react"
import { ModeratorItem } from "./components/ModeratorItem"

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
      <Heading fontSize={"24px"} fontWeight={700}>
        {t("Moderators")}
      </Heading>
      <Text color="#6A6A6A">
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

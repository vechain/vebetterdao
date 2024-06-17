import { Button, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../AdminAppPageContent"
import { AddressIcon } from "@/components/AddressIcon"
import { AddModeratorButton } from "./components/AddModeratorButton"
import { UilTrash } from "@iconscout/react-unicons"
import { useCallback } from "react"

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
        {moderators?.length
          ? t("These users will be able to update dApp information and feed news.")
          : t(
              "Your dApp's page doesn't have moderators yet. Add someone to assist you in handling the information on the page and the feed.",
            )}
      </Text>
      <VStack align="stretch" spacing={4} my={4} gap={4}>
        {moderators?.map((moderator, index) => (
          <HStack key={index} gap={6} justify={"space-between"}>
            <HStack>
              <AddressIcon address={moderator} h="48px" w="48px" rounded={"full"} />
              <Text fontSize={"14px"} color="#6A6A6A">
                {moderator}
              </Text>
            </HStack>
            <Button
              variant="dangerGhost"
              leftIcon={<UilTrash size={"14px"} color="#D23F63" />}
              onClick={handleDeleteModerator(index)}>
              {t("Remove")}
            </Button>
          </HStack>
        ))}
      </VStack>
      <AddModeratorButton editAdminForm={form} />
    </VStack>
  )
}

import { Heading, Text, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../AdminAppPageContent"
import { AddCreatorNFTButton } from "./components/AddCreatorNFTButton"
import { useCallback } from "react"
import { CreatorNFTItem } from "./components/CreatorNFTItem"

interface Props {
  form: UseFormReturn<AdminAppForm>
}
export const EditAppCreatorNFT = ({ form }: Props) => {
  const { t } = useTranslation()
  const creators = form.watch("creators")

  const handleDeleteCreator = useCallback(
    (index: number) => () =>
      form.setValue(
        "creators",
        creators.filter((_, i) => i !== index),
      ),
    [form, creators],
  )

  return (
    <VStack align="stretch">
      <Heading size="2xl">{t("Creator NFT")}</Heading>
      <Text color="#6A6A6A">
        {t(
          "These users will be able to join the Discord channels, participate in the endorsement phases, and submit new apps.",
        )}
      </Text>
      <VStack align="stretch" gap={4} my={4}>
        {creators?.map((creator, index) => (
          <CreatorNFTItem key={creator} creator={creator} handleDeleteCreator={handleDeleteCreator(index)} />
        ))}
      </VStack>
      <AddCreatorNFTButton editAdminForm={form} />
    </VStack>
  )
}

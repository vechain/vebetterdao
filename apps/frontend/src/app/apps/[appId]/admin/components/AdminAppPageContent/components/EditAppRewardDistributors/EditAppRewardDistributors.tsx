import { Text, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AdminAppForm } from "../../AdminAppPageContent"
import { useCallback } from "react"
import { DistributorItem } from "./components/DistributorItem"
import { AddRewardDistributorButton } from "./components/AddRewardDistributorButton"

interface Props {
  form: UseFormReturn<AdminAppForm>
}
export const EditAppRewardDistributors = ({ form }: Props) => {
  const { t } = useTranslation()
  const distributors = form.watch("distributors")

  const handleDeleteDistributor = useCallback(
    (index: number) => () =>
      form.setValue(
        "distributors",
        distributors.filter((_, i) => i !== index),
      ),
    [form, distributors],
  )

  return (
    <VStack align="stretch">
      <Text fontSize="md" fontWeight={"800"}>
        {t("Reward distributors")}
      </Text>
      <Text fontSize="sm">
        {t(
          "These addresses will be able to distribute rewards to users using your app balance and withdraw funds from the app.",
        )}
      </Text>
      <VStack align="stretch" gap={4} my={4}>
        {distributors?.map((distributor, index) => (
          <DistributorItem
            key={distributor}
            distributor={distributor}
            handleDeleteDistributor={handleDeleteDistributor(index)}
          />
        ))}
      </VStack>
      <AddRewardDistributorButton editAdminForm={form} />
    </VStack>
  )
}

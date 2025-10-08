import { Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const VeWorldFeaturedImageGuidelines = () => {
  const { t } = useTranslation()

  return (
    <>
      {t("Recommended size: 720x720 (minimum).")}{" "}
      <Text as="span" color="orange.500" fontWeight="semibold" borderRadius="sm">
        {t("Assets should not contain logos, brands, text, or any unrelated objects/elements to the app's purpose.")}
      </Text>
    </>
  )
}

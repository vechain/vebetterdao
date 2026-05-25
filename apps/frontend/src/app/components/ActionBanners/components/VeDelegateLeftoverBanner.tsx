import { Button, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const VeDelegateLeftoverBanner = () => {
  const { t } = useTranslation()

  const goToVeDelegate = () => {
    window.open("https://vedelegate.vet", "_blank", "noopener noreferrer")
  }

  return (
    <GenericBanner
      title={t("Withdraw leftover veDelegate balance")}
      description={
        <Text color="text.subtle" lineClamp="4">
          {t(
            "You still have VOT3 sitting in your veDelegate account but are now participating in governance directly. Withdraw it on veDelegate to free up that balance.",
          )}
        </Text>
      }
      illustration="/assets/logos/veDelegate.svg"
      cta={
        <Button p="0" size={{ base: "sm", md: "md" }} variant="link" onClick={goToVeDelegate}>
          {t("Go to veDelegate")}
        </Button>
      }
    />
  )
}

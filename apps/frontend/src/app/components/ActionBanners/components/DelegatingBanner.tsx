import { Button, Text, Icon } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation, Trans } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const DelegatingBanner = () => {
  const { t } = useTranslation()
  const whatIsVeDelegate = () => {
    window.open("https://docs.vedelegate.vet/faq#what-is-a-vepassport", "_blank", "noopener noreferrer")
  }
  const goToVeDelegate = () => {
    window.open("https://vedelegate.vet", "_blank", "noopener noreferrer")
  }
  const description = (
    <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold">
      <Trans
        i18nKey="Your voting power has been transferred to <platform>veDelegate.vet</platform> which votes on your behalf. If you want to vote here, you must remove delegation on veDelegate before snapshot."
        components={{
          platform: <Text as="span" cursor="pointer" fontWeight="900" onClick={goToVeDelegate} />,
        }}
      />
    </Text>
  )
  return (
    <>
      <GenericBanner
        variant="info"
        title={t("Voting Power Delegated").toUpperCase()}
        description={description}
        logoSrc="/assets/logos/veDelegate.svg"
        cta={
          <Button variant="secondary" onClick={whatIsVeDelegate}>
            <Icon as={UilInfoCircle} />
            {t("Learn more")}
          </Button>
        }
      />
    </>
  )
}

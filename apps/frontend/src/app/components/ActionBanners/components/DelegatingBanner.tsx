import { Button, Link, Text } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation, Trans } from "react-i18next"

import { useVeDelegateAutoDeposit } from "@/api/contracts/veDelegate/hooks/useVeDelegateAutoDeposit"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const DelegatingBanner = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { hasAutoDeposit } = useVeDelegateAutoDeposit(account?.address)

  const whatIsVeDelegate = () => {
    window.open("https://docs.vedelegate.vet/faq#what-is-a-vepassport", "_blank", "noopener noreferrer")
  }

  const goToVeDelegate = () => {
    window.open("https://vedelegate.vet", "_blank", "noopener noreferrer")
  }

  const description = hasAutoDeposit ? (
    <Text color="text.subtle" lineClamp="4">
      <Trans
        i18nKey="delegating.autoDeposit"
        components={{
          platform: (
            <Link
              display="contents"
              fontWeight="bold"
              color="text.default"
              href="https://vedelegate.vet"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
        }}
      />
    </Text>
  ) : (
    <Text color="text.subtle" lineClamp="4">
      <Trans
        i18nKey="Your voting power has been transferred to <platform>veDelegate.vet</platform> which votes on your behalf. <br/> If you want to vote here, you must remove delegation on veDelegate before snapshot."
        components={{
          platform: (
            <Link display="contents" fontWeight="bold" color="text.default" target="_blank" rel="noopener noreferrer" />
          ),
        }}
      />
    </Text>
  )

  return (
    <>
      <GenericBanner
        title={t("Voting power delegated")}
        description={description}
        illustration="/assets/logos/veDelegate.svg"
        cta={
          hasAutoDeposit ? (
            <Button p="0" size={{ base: "sm", md: "md" }} variant="link" onClick={goToVeDelegate}>
              {t("Go to veDelegate")}
            </Button>
          ) : (
            <Button p="0" size={{ base: "sm", md: "md" }} variant="link" onClick={whatIsVeDelegate}>
              {t("Learn more")}
            </Button>
          )
        }
      />
    </>
  )
}

import { Button, Link, Text } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation, Trans } from "react-i18next"

import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { useVeDelegateAutoDeposit } from "@/api/contracts/veDelegate/hooks/useVeDelegateAutoDeposit"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useIsVeDelegated } from "@/hooks/useIsVeDelegated"
import { useRevokeDelegation } from "@/hooks/useRevokeDelegation"

export const DelegatingBanner = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { hasAutoDeposit } = useVeDelegateAutoDeposit(account?.address)
  const { data: isNavigatorDelegated } = useIsDelegated(account?.address)
  const { isVeDelegated } = useIsVeDelegated(account?.address ?? "")
  const { sendTransaction: sendRevoke } = useRevokeDelegation({ isDelegator: true })

  const whatIsVeDelegate = () => {
    window.open("https://docs.vedelegate.vet/faq#what-is-a-vepassport", "_blank", "noopener noreferrer")
  }

  const goToVeDelegate = () => {
    window.open("https://vedelegate.vet", "_blank", "noopener noreferrer")
  }

  // Highest-priority variant: user has delegated to a navigator AND their passport is delegated
  // to veDelegate — the navigator's vote is being shadowed by veDelegate's auto-vote.
  // Gate explicitly on isVeDelegated (not just hasAutoDeposit or any delegatee) — the revoke
  // CTA calls passport.revokeDelegation() which reverts if there is no active delegation.
  if (isNavigatorDelegated && isVeDelegated) {
    return (
      <GenericBanner
        title={t("Action required: revoke veDelegate")}
        description={
          <Text color="text.subtle" lineClamp="4">
            {t(
              "You delegated to a Navigator, but your passport is still delegated to veDelegate which keeps voting on your behalf. Revoke it so your Navigator can vote for you.",
            )}
          </Text>
        }
        illustration="/assets/logos/veDelegate.svg"
        cta={
          <Button p="0" size={{ base: "sm", md: "md" }} variant="link" onClick={() => sendRevoke()}>
            {t("Revoke veDelegate")}
          </Button>
        }
      />
    )
  }

  const description = hasAutoDeposit ? (
    <Text color="text.subtle" lineClamp="4">
      <Trans
        i18nKey="You are using <platform>veDelegate.vet</platform> with the connected wallet and have auto-deposit enabled. This automatically transfers your B3TR to veDelegate. Visit veDelegate to disable this option."
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

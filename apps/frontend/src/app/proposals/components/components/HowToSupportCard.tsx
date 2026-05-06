import { Button, Card, Heading, Link, Text } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"

import { VOTING_POWER_DOCS_LINK } from "@/constants/links"

import { useGetVot3UnlockedBalance } from "../../../../hooks/useGetVot3UnlockedBalance"

export const HowToSupportCard = ({ onOpenConvertModal }: { onOpenConvertModal: () => void }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { open: openWalletModal } = useWalletModal()
  const { data: userVot3Balance } = useGetVot3UnlockedBalance(account?.address)
  const userHasNoTokens = useMemo(() => {
    return userVot3Balance?.original === "0"
  }, [userVot3Balance])
  const buttonText = userHasNoTokens ? t("See apps") : t("Get voting power")
  const buttonOnClick = useCallback(() => {
    if (!account?.address) {
      return openWalletModal()
    }
    if (userHasNoTokens) {
      return router.push("/apps")
    }
    onOpenConvertModal()
  }, [account?.address, onOpenConvertModal, openWalletModal, router, userHasNoTokens])
  return (
    <Card.Root w="full" variant="primary" p="8">
      <Card.Body gap={4}>
        <Heading size="md">{t("How to support Grant and Proposal?")}</Heading>
        {userHasNoTokens ? (
          <>
            <Text color="text.subtle" textStyle="sm">
              {t(
                "To support and vote for your favourite projects  Apps through Grants and for Proposals, you first need B3TR tokens.",
              )}
            </Text>
            <Text color="text.subtle" textStyle="sm">
              <Trans
                i18nKey="Earn them by completing <b>three sustainable actions</b> in any VeBetter App."
                components={{
                  b: <b />,
                }}
              />
            </Text>
          </>
        ) : (
          <Text color="text.subtle" textStyle="sm">
            <Trans
              i18nKey="To support and vote for your favourite grants and proposal, you need to gain voting power. <Link>Learn more.</Link>"
              components={{
                Link: <Link target="_blank" href={VOTING_POWER_DOCS_LINK} textDecoration="underline" />,
              }}
            />
          </Text>
        )}

        <Button onClick={buttonOnClick} size="md" variant="tertiary" alignSelf="flex-start">
          {buttonText}
        </Button>
      </Card.Body>
    </Card.Root>
  )
}

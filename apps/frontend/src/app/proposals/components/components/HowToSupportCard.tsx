import { Card, Heading, Text, Button, Link } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { VOTING_POWER_DOCS_LINK } from "@/constants/links"
import { useGetVot3Balance } from "@/hooks"
import { useWallet } from "@vechain/vechain-kit"

export const HowToSupportCard = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { data: userVot3Balance } = useGetVot3Balance(account?.address)

  const userHasNoTokens = useMemo(() => {
    return userVot3Balance?.scaled === "0"
  }, [userVot3Balance])

  const buttonText = userHasNoTokens ? t("Get voting power") : t("See apps")
  const buttonOnClick = useCallback(() => {
    if (userHasNoTokens) {
      router.push("/apps")
    }
  }, [router, userHasNoTokens])
  return (
    <Card.Root w="full" variant="subtle">
      <Card.Body gap={2}>
        <Heading size="md">{t("How to support Grant and Proposal?")}</Heading>

        {userHasNoTokens ? (
          <>
            <Text color="text.subtle" fontSize="sm">
              {t(
                "To support and vote for your favourite projects  Apps through Grants and for Proposals, you first need B3TR tokens.",
              )}
            </Text>
            <Text color="text.subtle" fontSize="sm">
              <Trans
                i18nKey="Earn them by completing <b>three sustainable actions</b> in any VeBetter App."
                components={{
                  b: <b />,
                }}
              />
            </Text>
          </>
        ) : (
          <Text color="text.subtle" fontSize="sm">
            <Trans
              i18nKey="To support and vote for your favourite grants and proposal, you need to gain voting power. <link>Learn more.</link>"
              components={{
                link: <Link target="_blank" href={VOTING_POWER_DOCS_LINK} textDecoration="underline" />,
              }}
            />
          </Text>
        )}

        <Button
          onClick={buttonOnClick}
          variant="ghost"
          color="primary.500"
          _hover={{ bg: "none" }}
          p={0}
          alignSelf="flex-start">
          {buttonText}
        </Button>
      </Card.Body>
    </Card.Root>
  )
}

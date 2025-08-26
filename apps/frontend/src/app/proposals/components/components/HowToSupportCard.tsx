import { Card, Heading, Text, Button, Link } from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"

export const HowToSupportCard = () => {
  const { t } = useTranslation()

  return (
    <Card.Root w="full" variant="subtle" p={8} gap={3}>
      <Card.Header>
        <Heading size="sm">{t("How to support Grant and Proposal?")}</Heading>
      </Card.Header>

      <Card.Body>
        <Text color="subtle.active" fontSize="sm">
          <Trans
            i18nKey="Support your favourite grant by locking VOT3 tokens to help it reach the stage. <a>Learn more.</a>"
            components={{
              a: (
                <Link
                  target="_blank"
                  href="https://docs.vebetterdao.org/vebetterdao/governance#governance-process"
                  textDecoration="underline"
                />
              ),
            }}
          />
        </Text>
        <Text color="subtle.active" fontSize="sm">
          <Trans i18nKey="You’ll need to buy VOT3 — it’s the token used to support and signal interest in grant proposals." />
        </Text>
        <Button variant="ghost" _hover={{ bg: "none" }} color="primary.500" p={0} alignSelf="flex-start">
          {t("Get VOT3")}
        </Button>
      </Card.Body>
    </Card.Root>
  )
}

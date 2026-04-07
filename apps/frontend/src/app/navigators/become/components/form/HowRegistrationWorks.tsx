import { Card, CardBody, CardHeader, Heading, List, Separator, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const HowRegistrationWorks = () => {
  const { t } = useTranslation()

  const howItWorks = useMemo(
    () => [
      {
        heading: t("Fill in your profile"),
        description: t("Share your motivation, qualifications, and voting strategy so delegators can evaluate you."),
      },
      {
        heading: t("Disclose conflicts"),
        description: t(
          "Transparency builds trust. Declare any affiliations with apps, foundation roles, or conflicts of interest.",
        ),
      },
      {
        heading: t("Add your socials"),
        description: t("Link your Twitter, Discord, and website so the community can verify your identity."),
      },
      {
        heading: t("Stake B3TR"),
        description: t(
          "Stake at least 50,000 B3TR to register. Your stake determines your delegation capacity (10:1 ratio).",
        ),
      },
    ],
    [t],
  )

  return (
    <Card.Root variant="primary">
      <CardHeader>
        <Heading size="lg">{t("How registration works")}</Heading>
      </CardHeader>
      <CardBody>
        <List.Root gap={3}>
          {howItWorks.map((item, index) => (
            <List.Item key={item.heading} listStyle="none">
              <VStack align="stretch" gap={2} flex={1}>
                <Heading size="md" color="text.default">
                  {`${index + 1}. ${item.heading}`}
                </Heading>
                <Text color="text.subtle" textStyle="sm">
                  {item.description}
                </Text>
              </VStack>
              {index !== howItWorks.length - 1 && <Separator my={3} w="full" color="gray.200" />}
            </List.Item>
          ))}
        </List.Root>
      </CardBody>
    </Card.Root>
  )
}

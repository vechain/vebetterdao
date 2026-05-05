import { Card, CardBody, CardHeader, Heading, List, Separator, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const HowRegistrationWorks = () => {
  const { t } = useTranslation()

  const howItWorks = useMemo(
    () => [
      {
        heading: t("Motivation"),
        description: t("Share your motivation, qualifications, and voting strategy so delegators can evaluate you."),
      },
      {
        heading: t("Disclosures"),
        description: t(
          "Declare any conflicts of interest and link your social profiles so the community can verify your identity.",
        ),
      },
      {
        heading: t("Stake B3TR"),
        description: t(
          "Stake at least 50,000 B3TR to register. Your stake determines your delegation capacity (10:1 ratio).",
        ),
      },
      {
        heading: t("Accept terms"),
        description: t(
          "Acknowledge the protocol-enforced penalties for missed votes, late reports, and undisclosed conflicts.",
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

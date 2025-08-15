import { Card, Heading, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const ProposalsAdmin = () => {
  const { t } = useTranslation()
  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="2xl">{t("Proposals and Governance")}</Heading>
      </Card.Header>
      <Card.Body>
        <VStack w={"full"} gap={4} alignItems={"start"}></VStack>
      </Card.Body>
    </Card.Root>
  )
}

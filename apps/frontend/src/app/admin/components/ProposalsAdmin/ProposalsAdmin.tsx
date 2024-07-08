import { Card, CardBody, CardHeader, Heading, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const ProposalsAdmin = () => {
  const { t } = useTranslation()
  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">{t("Proposals and Governance")}</Heading>
      </CardHeader>
      <CardBody>
        <VStack w={"full"} spacing={4} alignItems={"start"}></VStack>
      </CardBody>
    </Card>
  )
}

import { Card, CardBody, CardHeader, Heading } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const AppBalanceCard = () => {
  const { t } = useTranslation()
  return (
    <Card w={"full"} variant="baseWithBorder">
      <CardHeader>
        <Heading size="md">{t("App balance")}</Heading>
      </CardHeader>
      <CardBody></CardBody>
    </Card>
  )
}

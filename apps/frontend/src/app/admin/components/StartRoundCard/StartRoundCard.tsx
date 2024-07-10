import { Card, CardHeader, Heading, CardBody, VStack } from "@chakra-ui/react"
import { StartEmissionsButton } from "./components/StartEmissionsButton"
import { StartRoundButton } from "./components/StartRoundButton"
import { useWallet } from "@vechain/dapp-kit-react"
import { useAccountPermissions } from "@/api/contracts/account"
import { useTranslation } from "react-i18next"

export const StartRoundCard = () => {
  const { account } = useWallet()
  const { isAdminOfEmissions } = useAccountPermissions(account ?? "")
  const { t } = useTranslation()

  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">{t("Emissions and Rounds")}</Heading>
      </CardHeader>
      <CardBody>
        <VStack w={"full"} spacing={4} alignItems={"start"}>
          {isAdminOfEmissions && <StartEmissionsButton />}
          <StartRoundButton />
        </VStack>
      </CardBody>
    </Card>
  )
}

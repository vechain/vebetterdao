import { Card, CardHeader, Heading, CardBody, VStack } from "@chakra-ui/react"
import { StartEmissionsButton } from "./components/StartEmissionsButton"
import { StartRoundButton } from "./components/StartRoundButton"
import { useWallet } from "@vechain/dapp-kit-react"
import { useAccountPermissions } from "@/api/contracts/account"

export const StartRoundCard = () => {
  const { account } = useWallet()
  const { isAdminOfEmissions } = useAccountPermissions(account ?? "")

  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">Emissions and Rounds</Heading>
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

import { Card, Heading, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { useAccountPermissions } from "../../../../api/contracts/account/hooks/useAccountPermissions"

import { StartEmissionsButton } from "./components/StartEmissionsButton"
import { StartRoundButton } from "./components/StartRoundButton"

export const StartRoundCard = () => {
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")
  const { t } = useTranslation()
  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="3xl">{t("Emissions and Rounds")}</Heading>
      </Card.Header>
      <Card.Body>
        <VStack w={"full"} gap={4} alignItems={"start"}>
          {permissions?.isAdminOfEmissions && <StartEmissionsButton />}
          <StartRoundButton />
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

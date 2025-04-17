import { usePassportChecks } from "@/api"
import { TogglePassportCheck } from "@/constants"
import { useTogglePassportCheck } from "@/hooks"
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  SimpleGrid,
  Switch,
  VStack,
} from "@chakra-ui/react"
import { useCallback } from "react"

export const PassportToggles = () => {
  const {
    isWhiteListCheckEnabled,
    isBlackListCheckEnabled,
    isSignalingCheckEnabled,
    isParticipationScoreCheckEnabled,
    isGMOwnershipCheckEnabled,
  } = usePassportChecks()

  return (
    <Card>
      <CardHeader>
        <Heading size="lg">{"Passport checks enabled"}</Heading>
      </CardHeader>
      <CardBody>
        <FormControl as={SimpleGrid} gap={3}>
          <PassportCheck
            name={"Whitelist Check"}
            isEnabled={isWhiteListCheckEnabled === true}
            checkToToggle={TogglePassportCheck.WhitelistCheck}
          />
          <PassportCheck
            name={"Blacklist Check"}
            isEnabled={isBlackListCheckEnabled === true}
            checkToToggle={TogglePassportCheck.BlacklistCheck}
          />
          <PassportCheck
            name={"Signaling Check"}
            isEnabled={isSignalingCheckEnabled === true}
            checkToToggle={TogglePassportCheck.SignalingCheck}
          />
          <PassportCheck
            name={"Participation Score Check"}
            isEnabled={isParticipationScoreCheckEnabled === true}
            checkToToggle={TogglePassportCheck.ParticipationScoreCheck}
          />
          <PassportCheck
            name={"GM Ownership Check"}
            isEnabled={isGMOwnershipCheckEnabled === true}
            checkToToggle={TogglePassportCheck.GmOwnershipCheck}
          />
        </FormControl>
      </CardBody>
    </Card>
  )
}

type PassportCheckProps = {
  name: string
  isEnabled: boolean
  checkToToggle: TogglePassportCheck
}

const PassportCheck = ({ name, isEnabled, checkToToggle }: PassportCheckProps) => {
  const { sendTransaction, isTransactionPending, status } = useTogglePassportCheck({
    checkToToggle,
  })

  const handleToggle = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()

      sendTransaction()
    },
    [sendTransaction],
  )

  return (
    <VStack>
      <HStack w={"full"} justifyContent={"space-between"}>
        <FormLabel>{name}</FormLabel>
        <Switch
          isChecked={isEnabled}
          onChange={event => handleToggle(event)}
          disabled={isTransactionPending || status === "pending"}
        />
      </HStack>
      <Divider />
    </VStack>
  )
}

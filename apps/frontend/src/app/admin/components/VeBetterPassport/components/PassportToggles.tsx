import { Card, Separator, Field, Heading, HStack, SimpleGrid, Switch, VStack } from "@chakra-ui/react"

import { usePassportChecks } from "../../../../../api/contracts/vePassport/hooks/usePassportChecks"
import { TogglePassportCheck } from "../../../../../constants/Passport"
import { useTogglePassportCheck } from "../../../../../hooks/useTogglePassportCheck"

export const PassportToggles = () => {
  const {
    isWhiteListCheckEnabled,
    isBlackListCheckEnabled,
    isSignalingCheckEnabled,
    isParticipationScoreCheckEnabled,
    isGMOwnershipCheckEnabled,
  } = usePassportChecks()
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="3xl">{"Passport checks enabled"}</Heading>
      </Card.Header>
      <Card.Body>
        <SimpleGrid gap={3}>
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
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
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

  return (
    <Field.Root>
      <VStack>
        <HStack w={"full"} justifyContent={"space-between"}>
          <Field.Label>{name}</Field.Label>
          <Switch.Root
            checked={isEnabled}
            onCheckedChange={() => sendTransaction()}
            disabled={isTransactionPending || status === "pending"}>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
        <Separator />
      </VStack>
    </Field.Root>
  )
}

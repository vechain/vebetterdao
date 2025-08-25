import { usePassportChecks } from "@/api"
import { TogglePassportCheck } from "@/constants"
import { useTogglePassportCheck } from "@/hooks"
import { Card, Separator, Field, Heading, HStack, SimpleGrid, Switch, VStack } from "@chakra-ui/react"

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
        <Field.Root as={SimpleGrid} gap={3}>
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
        </Field.Root>
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

  // const handleToggle = useCallback(
  //   (event?: { preventDefault: () => void }) => {
  //     if (event) event.preventDefault()

  //     sendTransaction()
  //   },
  //   [sendTransaction],
  // )

  return (
    <VStack>
      <HStack w={"full"} justifyContent={"space-between"}>
        <Field.Label>{name}</Field.Label>
        <Switch.Root
          checked={isEnabled}
          onCheckedChange={() => sendTransaction()}
          disabled={isTransactionPending || status === "pending"}>
          <Switch.Control />
        </Switch.Root>
      </HStack>
      <Separator />
    </VStack>
  )
}

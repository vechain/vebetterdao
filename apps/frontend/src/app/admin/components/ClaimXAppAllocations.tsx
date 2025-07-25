import {
  useAllocationsRound,
  useCurrentAllocationsRoundId,
  useHasXAppClaimed,
  useXApps,
  useXAppRoundEarnings,
} from "@/api"
import { useClaimXAppsAllocations } from "@/hooks"
import {
  VStack,
  Button,
  Field,
  InputGroup,
  Input,
  Heading,
  HStack,
  Text,
  NumberInput,
  Card,
  NativeSelect,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const ClaimXAppAllocations = () => {
  const [appId, setAppId] = useState<string | undefined>()
  const [roundId, setRoundId] = useState<string>("1")
  const { t } = useTranslation()
  const { data: xApps } = useXApps()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")
  const { data: claimableAmountResponse } = useXAppRoundEarnings(roundId?.toString() || "", appId || "")
  const { data: claimedResponse } = useHasXAppClaimed(roundId?.toString() ?? "", appId || "")

  const { sendTransaction, isTransactionPending, status } = useClaimXAppsAllocations({
    roundId: roundId?.toString() ?? "",
    appIds: appId ? [appId] : [],
  })
  const isLoading = isTransactionPending || status === "pending"

  const handleSubmit = useCallback(
    (event: { preventDefault: () => void }) => {
      event.preventDefault()
      sendTransaction()
    },
    [sendTransaction],
  )

  const isRoundValid = useMemo(() => {
    if (currentRoundId === undefined || !currentRound) return false
    if (parseInt(roundId) === parseInt(currentRoundId) && currentRound.state === 0) return false
    if (parseInt(roundId) > parseInt(currentRoundId) || parseInt(roundId) === 0) return false

    return true
  }, [roundId, currentRoundId, currentRound])

  const isFormValid = useMemo(() => isRoundValid && appId !== undefined && appId[0] !== "", [appId, isRoundValid])

  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="lg">{t("Allocation claiming")}</Heading>
      </Card.Header>
      <Card.Body>
        <VStack flex={1} align="flex-start" gap={8}>
          <VStack align={"start"}>
            <Text>
              {t("Last round id:")} {currentRoundId}
            </Text>
          </VStack>
          <form onSubmit={handleSubmit}>
            <VStack gap={4} alignItems={"start"}>
              <HStack w={"full"}>
                <Field.Root required>
                  <Field.Label>
                    <strong>{"App"}</strong>
                  </Field.Label>
                  <NativeSelect.Root disabled={isLoading}>
                    <NativeSelect.Field placeholder="Select app" onChange={e => setAppId(e.target.value)} value={appId}>
                      {xApps?.active.map(item => {
                        return (
                          <option key={item.id} value={item.id}>
                            {item.name + " - id: " + item.id}
                          </option>
                        )
                      })}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>

                <Field.Root required invalid={!isRoundValid}>
                  <Field.Label>
                    <strong>{"Round #"}</strong>
                  </Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={roundId}
                    disabled={isLoading}
                    onValueChange={e => setRoundId(e.value)}>
                    <NumberInput.Input />
                    <NumberInput.Control>
                      <NumberInput.IncrementTrigger />
                      <NumberInput.DecrementTrigger />
                    </NumberInput.Control>
                  </NumberInput.Root>
                  <Field.ErrorText>{"Invalid round"}</Field.ErrorText>
                </Field.Root>
              </HStack>

              <Field.Root>
                <Field.Label>
                  <strong>{"Reserved amount"}</strong>
                </Field.Label>
                <InputGroup
                  endElement={
                    <Text
                      pointerEvents="none"
                      pl={1}
                      pr={1}
                      ml={0}
                      backgroundColor={"transparent"}
                      borderColor={"inherit"}
                      borderLeft={"none"}>
                      {t("B3TR")}
                    </Text>
                  }>
                  <Input
                    placeholder="Reserved allocation"
                    type="number"
                    value={claimableAmountResponse?.amount ?? ""}
                    disabled={true}
                  />
                </InputGroup>
              </Field.Root>

              <Button
                disabled={!isFormValid || claimedResponse?.claimed}
                colorPalette="blue"
                type="submit"
                loading={isLoading}>
                {claimedResponse?.claimed ? "Already claimed" : "Claim"}
              </Button>
            </VStack>
          </form>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

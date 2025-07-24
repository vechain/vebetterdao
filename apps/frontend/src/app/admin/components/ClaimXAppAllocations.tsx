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
  Select,
  HStack,
  Text,
  NumberInput,
  Card,
  Portal,
  createListCollection,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const ClaimXAppAllocations = () => {
  const [appId, setAppId] = useState<string[]>([])
  const [roundId, setRoundId] = useState<string>("1")
  const { t } = useTranslation()
  const { data: xApps } = useXApps()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")
  const { data: claimableAmountResponse } = useXAppRoundEarnings(roundId?.toString() || "", appId[0] || "")
  const { data: claimedResponse } = useHasXAppClaimed(roundId?.toString() ?? "", appId[0] ?? "")

  const appsCollection = useMemo(() => {
    return createListCollection({
      items:
        xApps?.active.map(item => ({
          label: item.name + " - id: " + item.id,
          value: item.id,
        })) ?? [],
    })
  }, [xApps])

  const { sendTransaction, isTransactionPending, status } = useClaimXAppsAllocations({
    roundId: roundId?.toString() ?? "",
    appIds: appId[0] ? [appId[0]] : [],
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
                  <Select.Root
                    disabled={isLoading}
                    collection={appsCollection}
                    onValueChange={e => setAppId(e.value)}
                    value={appId}>
                    <Select.HiddenSelect />

                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select app" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {appsCollection.items.map(item => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
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
                  endAddon={
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
                colorScheme="blue"
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

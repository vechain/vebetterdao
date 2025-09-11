import { useParticipationScoreThreshold } from "@/api"
import { useSetParticipationThreshold } from "@/hooks"
import { Button, Card, Field, Heading, HStack, NumberInput, Text, VStack } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const ParticipationScoreThreshold = () => {
  const [threshold, setThresholdPoPScore] = useState<string>("")
  const [isThresholdFieldDirty, setIsThresholdFieldDirty] = useState<boolean>(false)

  const isThresholdValid = useMemo(() => {
    if (!threshold) return false
    return Number(threshold) >= 0
  }, [threshold])

  const { data: participationScoreThreshold } = useParticipationScoreThreshold()
  const { t } = useTranslation()

  const { sendTransaction, isTransactionPending, status } = useSetParticipationThreshold({
    participationThreshold: Number(threshold) ?? 0,
  })

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()

      sendTransaction()
    },
    [sendTransaction],
  )

  const isLoading = isTransactionPending || status === "pending"
  const isFormValid = useMemo(() => isThresholdValid, [isThresholdValid])

  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="3xl">{t("Participation score threshold")}</Heading>
        <Text fontSize="sm">{t("Change the minimum participation score required to be considered a person.")}</Text>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit}>
          <VStack gap={4} alignItems={"start"}>
            <VStack align={"start"}>
              <Text>
                {t("Current participation score threshold:")} {participationScoreThreshold}
              </Text>
            </VStack>

            <HStack gap={4} w={"full"} justify={"space-between"} align={"start"}>
              <Field.Root invalid={!isThresholdValid && isThresholdFieldDirty} w={"full"}>
                <Field.Label>
                  <strong>{t("New threshold")}</strong>
                </Field.Label>
                <NumberInput.Root
                  value={threshold}
                  disabled={isLoading}
                  onValueChange={e => {
                    setThresholdPoPScore(e.value)
                    setIsThresholdFieldDirty(true)
                  }}>
                  <NumberInput.Input />
                  <NumberInput.Control />
                </NumberInput.Root>
                <Field.ErrorText>{t("Invalid amount")}</Field.ErrorText>
              </Field.Root>
            </HStack>
            <Button disabled={!isFormValid} colorPalette="blue" type="submit" loading={isLoading}>
              {t("Update threshold")}
            </Button>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  )
}

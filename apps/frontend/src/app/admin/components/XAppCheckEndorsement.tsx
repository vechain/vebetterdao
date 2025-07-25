import { useAllocationsRound, useCurrentAllocationsRoundId, useXApps } from "@/api"
import { VStack, Button, Field, Heading, NativeSelect, HStack, Text, Card } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useCheckEndorsement } from "@/hooks/useCheckEndorsement"

export const XAppCheckEndorsement = () => {
  const [appId, setAppId] = useState<string | undefined>()
  const { t } = useTranslation()
  const { data: xApps } = useXApps()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")

  const { sendTransaction, isTransactionPending, status } = useCheckEndorsement({
    appId: appId ?? "",
  })
  const isLoading = isTransactionPending || status === "pending"

  const handleSubmit = useCallback(
    (event: { preventDefault: () => void }) => {
      if (event) event?.preventDefault()
      sendTransaction()
    },
    [sendTransaction],
  )
  const isRoundValid = useMemo(() => {
    if (currentRoundId === undefined || !currentRound) return false
    return true
  }, [currentRoundId, currentRound])

  const isFormValid = useMemo(() => isRoundValid && appId !== undefined && appId !== "", [appId, isRoundValid])

  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="lg">{t("Check Endorsement")}</Heading>
      </Card.Header>
      <Card.Body>
        <VStack flex={1} align="flex-start" gap={8}>
          <VStack align={"start"}>
            <Text>
              {currentRound.voteEndTimestamp?.isBefore()
                ? t("Last round (#{{currentRoundId}}) ended {{currentRoundEndedAt}}", {
                    currentRoundId: currentRoundId,
                    currentRoundEndedAt: currentRound.voteEndTimestamp?.fromNow(),
                  })
                : t("Current round (#{{currentRoundId}}) will end in {{currentRoundEndsAt}}", {
                    currentRoundId: currentRoundId,
                    currentRoundEndsAt: currentRound.voteEndTimestamp?.fromNow(),
                  })}
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
                      {xApps?.allApps.map(item => {
                        return (
                          <option key={`AppSelectOption-${item?.id}`} value={item.id}>
                            {item.name + " - id: " + item.id}
                          </option>
                        )
                      })}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>
              </HStack>

              <Button disabled={!isFormValid} colorPalette="blue" type="submit" loading={isLoading}>
                {t("Check Endorsement")}
              </Button>
            </VStack>
          </form>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

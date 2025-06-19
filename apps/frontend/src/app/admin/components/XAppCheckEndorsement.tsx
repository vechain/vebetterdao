import { useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import {
  VStack,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Select,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
} from "@chakra-ui/react"
import { useXApps } from "@vechain/vechain-kit"
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
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">{t("Check Endorsement")}</Heading>
      </CardHeader>
      <CardBody>
        <VStack flex={1} align="flex-start" spacing={8}>
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
            <VStack spacing={4} alignItems={"start"}>
              <HStack w={"full"}>
                <FormControl isRequired>
                  <FormLabel>
                    <strong>{"App"}</strong>
                  </FormLabel>
                  <Select
                    placeholder="Select app"
                    isDisabled={isLoading}
                    onChange={e => setAppId(e.target.value)}
                    value={appId}>
                    {xApps?.allApps.map(item => {
                      return (
                        <option key={`AppSelectOption-${item?.id}`} value={item.id}>
                          {item.name + " - id: " + item.id}
                        </option>
                      )
                    })}
                  </Select>
                </FormControl>
              </HStack>

              <Button isDisabled={!isFormValid} colorScheme="blue" type="submit" isLoading={isLoading}>
                {t("Check Endorsement")}
              </Button>
            </VStack>
          </form>
        </VStack>
      </CardBody>
    </Card>
  )
}

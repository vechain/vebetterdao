import { useParticipationScoreThreshold } from "@/api"
import { useSetParticipationThreshold } from "@/hooks"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const ParticipationScoreThreshold = () => {
  const [threshold, setThresholdPoPScore] = useState<number | undefined>()
  const [isThresholdFieldDirty, setIsThresholdFieldDirty] = useState<boolean>(false)

  const isThresholdValid = useMemo(() => {
    if (!threshold) return false
    return threshold >= 0
  }, [threshold])

  const { data: participationScoreThreshold } = useParticipationScoreThreshold()
  const { t } = useTranslation()

  const { sendTransaction, isTransactionPending, status } = useSetParticipationThreshold({
    participationThreshold: threshold ?? 0,
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
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">{t("Participation score threshold")}</Heading>
        <Text fontSize="sm">{t("Change the minimum participation score required to be considered a person.")}</Text>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} alignItems={"start"}>
            <VStack align={"start"}>
              <Text>
                {t("Current participation score threshold:")} {participationScoreThreshold}
              </Text>
            </VStack>

            <HStack spacing={4} w={"full"} justify={"space-between"} align={"start"}>
              <FormControl isInvalid={!isThresholdValid && isThresholdFieldDirty} w={"full"}>
                <FormLabel>
                  <strong>{t("New threshold")}</strong>
                </FormLabel>
                <NumberInput
                  min={1}
                  value={threshold}
                  isDisabled={isLoading}
                  onChange={value => {
                    setThresholdPoPScore(parseInt(value))
                    setIsThresholdFieldDirty(true)
                  }}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{t("Invalid amount")}</FormErrorMessage>
              </FormControl>
            </HStack>
            <Button isDisabled={!isFormValid} colorScheme="blue" type="submit" isLoading={isLoading}>
              {t("Update threshold")}
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}

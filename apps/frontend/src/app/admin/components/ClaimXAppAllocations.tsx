import {
  useAllocationsRound,
  useCurrentAllocationsRoundId,
  useHasXAppClaimed,
  useXAppRoundEarnings,
  useXApps,
} from "@/api"
import { useClaimXAppsAllocations } from "@/hooks"
import {
  VStack,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  Heading,
  FormErrorMessage,
  Select,
  HStack,
  Text,
  InputRightAddon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Card,
  CardHeader,
  CardBody,
} from "@chakra-ui/react"
import { useMemo, useState } from "react"

export const ClaimXAppAllocations = () => {
  const [appId, setAppId] = useState<string | undefined>()
  const [roundId, setRoundId] = useState<number>(1)

  const { data: xApps } = useXApps()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")
  const { data: claimableAmountResponse } = useXAppRoundEarnings(roundId?.toString() || "", appId || "")

  const { data: claimedResponse } = useHasXAppClaimed(roundId?.toString() ?? "", appId ?? "")

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useClaimXAppsAllocations({
    roundId: roundId?.toString() ?? "",
    appIds: appId ? [appId] : [],
  })
  const isLoading = isTxReceiptLoading || sendTransactionPending

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    sendTransaction()
  }

  const isRoundValid = useMemo(() => {
    if (currentRoundId === undefined || !currentRound) return false
    if (roundId === parseInt(currentRoundId) && currentRound.state === 0) return false
    if (roundId > parseInt(currentRoundId) || roundId === 0) return false

    return true
  }, [roundId, currentRoundId, currentRound])

  const isFormValid = useMemo(() => isRoundValid && appId !== undefined && appId !== "", [appId, isRoundValid])

  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">Allocation claiming</Heading>
      </CardHeader>
      <CardBody>
        <VStack flex={1} align="flex-start" spacing={8}>
          <VStack align={"start"}>
            <Text>Last round id: {currentRoundId}</Text>
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
                    {xApps?.map(item => {
                      return (
                        <option key={item.id} value={item.id}>
                          {item.name + " - id: " + item.id}
                        </option>
                      )
                    })}
                  </Select>
                </FormControl>

                <FormControl isRequired isInvalid={!isRoundValid}>
                  <FormLabel>
                    <strong>{"Round #"}</strong>
                  </FormLabel>
                  <NumberInput
                    min={0}
                    value={roundId}
                    isDisabled={isLoading}
                    onChange={value => setRoundId(parseInt(value))}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormErrorMessage>{"Invalid round"}</FormErrorMessage>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>
                  <strong>{"Reserved amount"}</strong>
                </FormLabel>

                <InputGroup>
                  <Input
                    placeholder="Reserved allocation"
                    type="number"
                    value={claimableAmountResponse?.amount ?? ""}
                    disabled={true}
                  />
                  <InputRightAddon
                    pointerEvents="none"
                    pl={1}
                    pr={1}
                    ml={0}
                    backgroundColor={"transparent"}
                    borderColor={"inherit"}
                    borderLeft={"none"}>
                    B3TR
                  </InputRightAddon>
                </InputGroup>
              </FormControl>

              <Button
                isDisabled={!isFormValid || claimedResponse?.claimed}
                colorScheme="blue"
                type="submit"
                isLoading={isLoading}>
                {claimedResponse?.claimed ? "Already claimed" : "Claim"}
              </Button>
            </VStack>
          </form>
        </VStack>
      </CardBody>
    </Card>
  )
}

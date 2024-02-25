import {
  useCurrentAllocationsRoundId,
  useHasXAppClaimed,
  useIsRoundFinalized,
  useXAppClaimableAmount,
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
  Card,
  CardHeader,
  CardBody,
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
} from "@chakra-ui/react"
import { useMemo, useState } from "react"

export const ClaimXAppAllocations = () => {
  const [appId, setAppId] = useState<string | undefined>()
  const [roundId, setRoundId] = useState<number>(1)

  const { data: xApps } = useXApps()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: claimableAmountResponse } = useXAppClaimableAmount(roundId?.toString() || "", appId || "")

  const { data: isLastRoundFinalized } = useIsRoundFinalized(currentRoundId)
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
    if (currentRoundId === undefined) return false
    if (roundId === parseInt(currentRoundId) && !isLastRoundFinalized) return false

    if (roundId && roundId > 0 && roundId <= parseInt(currentRoundId)) {
      return true
    }

    return false
  }, [roundId, currentRoundId, isLastRoundFinalized])

  const isFormValid = useMemo(() => isRoundValid && appId !== undefined && appId !== "", [appId, isRoundValid])

  return (
    <Card w={"full"}>
      <CardHeader>
        <HStack justify={"space-between"} align={"start"}>
          <VStack align={"start"}>
            <Heading size="md">Allocation claiming</Heading>
            <Text>
              Last round id: {currentRoundId} {`(${isLastRoundFinalized ? "finalized" : "not finalized"})`}
            </Text>
          </VStack>
        </HStack>
      </CardHeader>
      <CardBody>
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
                        {item.name + " - " + item.id}
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
                <FormErrorMessage>{"Round invalid or not finalized"}</FormErrorMessage>
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
      </CardBody>
    </Card>
  )
}

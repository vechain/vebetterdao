import {
  useCurrentAllocationsRoundId,
  useHasXAppClaimed,
  useIsRoundFinalized,
  useXAppClaimableAmount,
  useXApps,
} from "@/api"
import { useClaimXAppAllocation } from "@/hooks"
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
import { useEffect, useMemo, useState } from "react"

export const ClaimXAppAllocations = () => {
  const [appId, setAppId] = useState<string | undefined>()
  const [roundId, setRoundId] = useState<number>(1)
  const [roundFieldIsDirty, setRoundFieldIsDirty] = useState(false)
  const [amountToClaim, setAmountToClaim] = useState<number>(0)

  const { data: xApps } = useXApps()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: claimableAmount } = useXAppClaimableAmount(roundId?.toString() ?? "", appId ?? "")
  const { data: isLastRoundFinalized } = useIsRoundFinalized(currentRoundId)
  const { data: claimed } = useHasXAppClaimed(roundId?.toString() ?? "", appId ?? "")

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useClaimXAppAllocation({
    roundId: roundId?.toString() ?? "",
    appId: appId ?? "",
    invalidateCache: true,
  })
  const isLoading = isTxReceiptLoading || sendTransactionPending

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    sendTransaction(undefined)
  }

  useEffect(() => {
    // if there is a claimable amount and it hasn't been claimed yet, set the amount to claim
    if (claimableAmount !== undefined && claimed !== undefined && !claimed) {
      setAmountToClaim(parseInt(claimableAmount))
    } else {
      setAmountToClaim(0)
    }
  }, [claimableAmount, appId, claimed])

  const isRoundValid = useMemo(() => {
    if (currentRoundId === undefined) return false
    if (roundId === parseInt(currentRoundId) && !isLastRoundFinalized) return false

    if (roundId && roundId > 0 && roundId <= parseInt(currentRoundId)) {
      return true
    }

    return false
  }, [roundId, currentRoundId])

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
                      <option key={"Select" + item.name} value={item.id}>
                        {item.name}
                      </option>
                    )
                  })}
                </Select>
              </FormControl>

              <FormControl isRequired isInvalid={!isRoundValid && roundFieldIsDirty}>
                <FormLabel>
                  <strong>{"Round #"}</strong>
                </FormLabel>
                <NumberInput
                  min={0}
                  value={roundId}
                  isDisabled={isLoading}
                  onChange={value => {
                    setRoundId(parseInt(value))
                    setRoundFieldIsDirty(true)
                  }}>
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
                <strong>{"Claimable amount"}</strong>
              </FormLabel>
              <InputGroup>
                <Input placeholder="Amount to claim" type="number" value={amountToClaim} disabled={true} />
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

            <Button isDisabled={!isFormValid || claimed} colorScheme="blue" type="submit" isLoading={isLoading}>
              {claimed ? "Already claimed" : "Claim"}
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}

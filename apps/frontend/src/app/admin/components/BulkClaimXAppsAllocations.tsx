import {
  useCurrentAllocationsRoundId,
  useHasXAppClaimed,
  useIsRoundFinalized,
  useXAppClaimableAmount,
  useXApps,
  useHaveXAppsClaimed,
  useXAppsClaimableAmounts,
} from "@/api"
import { useBulkClaimXAppsAllocations, useClaimXAppAllocation } from "@/hooks"
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

export const BulkClaimXAppsAllocations = () => {
  const [roundId, setRoundId] = useState<number>(1)
  const [roundFieldIsDirty, setRoundFieldIsDirty] = useState(false)

  const { data: xApps } = useXApps()

  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: isLastRoundFinalized } = useIsRoundFinalized(currentRoundId)

  const claims = useHaveXAppsClaimed(roundId?.toString() ?? "", xApps?.map(app => app.id) ?? [])
  const allAppsClaimed = useMemo(() => {
    return !claims.some(claim => !claim.data?.claimed)
  }, [claims])
  const xAppsToClaim = useMemo(() => {
    return xApps?.filter(app => !claims.find(claim => claim.data?.id === app.id)?.data?.claimed)
  }, [claims, xApps])

  const totalClaimableAmoount = useXAppsClaimableAmounts(roundId?.toString() ?? "", xApps?.map(app => app.id) ?? [])
  const totalAmountToClaim = useMemo(() => {
    return totalClaimableAmoount?.reduce((acc, cur) => acc + parseInt(cur.data?.amount ?? "0"), 0)
  }, [totalClaimableAmoount])

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useBulkClaimXAppsAllocations({
    roundId: roundId?.toString() ?? "",
    appIds: xAppsToClaim?.map(app => app.id) ?? [],
    invalidateCache: true,
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
  }, [roundId, currentRoundId])

  return (
    <Card w={"full"}>
      <CardHeader>
        <HStack justify={"space-between"} align={"start"}>
          <VStack align={"start"}>
            <Heading size="md">Bulk allocation claiming</Heading>
            <VStack spacing={0} align={"start"}>
              <Text>
                Last round id: {currentRoundId} {`(${isLastRoundFinalized ? "finalized" : "not finalized"})`}
              </Text>
              <Text> Total apps: {xApps?.length}</Text>
              <Text> Apps that needs to claim: {xAppsToClaim?.length}</Text>
            </VStack>
          </VStack>
        </HStack>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} alignItems={"start"}>
            <HStack w={"full"}>
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
                <strong>{"Total amount"}</strong>
              </FormLabel>
              <InputGroup>
                <Input value={totalAmountToClaim ?? 0} disabled={true} />
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

            <Button isDisabled={allAppsClaimed} colorScheme="blue" type="submit" isLoading={isLoading}>
              {allAppsClaimed ? "Already claimed" : "Claim for all"}
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}

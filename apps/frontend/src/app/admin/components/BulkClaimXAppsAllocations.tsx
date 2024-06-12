import {
  useAllocationsRound,
  useCurrentAllocationsRoundId,
  useHaveXAppsClaimed,
  useRoundXApps,
  useRoundEarnings,
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

export const BulkClaimXAppsAllocations = () => {
  const [roundId, setRoundId] = useState<number>(1)

  const { data: xApps } = useRoundXApps(roundId?.toString() ?? "")
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")

  // Calculate total amount that is avaialble to claim in this round
  const totalAmounts = useRoundEarnings(roundId?.toString() ?? "", xApps?.map(app => app.id) ?? [])
  const total = useMemo(() => {
    return totalAmounts.reduce((acc, cur) => acc + parseInt(cur.data?.amount ?? "0"), 0)
  }, [totalAmounts])

  // Retrieve all apps that have claimed for the round and the ones that still needs to claim
  const claims = useHaveXAppsClaimed(roundId?.toString() ?? "", xApps?.map(app => app.id) ?? [])
  const allClaimed = useMemo(() => {
    return !claims.some(claim => !claim.data?.claimed)
  }, [claims])
  const xAppsLeft = useMemo(() => {
    return xApps?.filter(app => !claims.find(claim => claim.data?.appId === app.id)?.data?.claimed)
  }, [claims, xApps])

  // Calculate remaining amount to claim excluding already claimed
  const remainingAmounts = useRoundEarnings(roundId?.toString() ?? "", xAppsLeft?.map(app => app.id) ?? [])
  const amountToClaim = useMemo(() => {
    return remainingAmounts?.reduce((acc, cur) => acc + parseInt(cur.data?.amount ?? "0"), 0)
  }, [remainingAmounts])

  // Handle submitting the transaction
  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useClaimXAppsAllocations({
    roundId: roundId?.toString() ?? "",
    appIds: xAppsLeft?.map(app => app.id) ?? [],
  })
  const isLoading = isTxReceiptLoading || sendTransactionPending

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    sendTransaction()
  }

  // Validate roundId input
  const isRoundValid = useMemo(() => {
    if (currentRoundId === undefined || !currentRound) return false
    if (roundId === parseInt(currentRoundId) && currentRound.state === 0) return false
    if (roundId > parseInt(currentRoundId) || roundId === 0) return false

    return true
  }, [roundId, currentRoundId, currentRound])

  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">Bulk allocation claiming</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={8} alignItems={"start"} flex={1} w="full">
          <VStack align={"start"}>
            <VStack spacing={0} align={"start"}>
              <Text> Total apps: {xApps?.length}</Text>
              <Text> Remaing apps that needs claiming: {xAppsLeft?.length}</Text>
            </VStack>
          </VStack>
          <form
            onSubmit={handleSubmit}
            style={{
              width: "100%",
            }}>
            <VStack spacing={4} alignItems={"start"} w="full">
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

              <FormControl>
                <FormLabel>
                  <strong>{"Total"}</strong>
                </FormLabel>
                <InputGroup>
                  <Input value={total} disabled={true} />
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

              <FormControl>
                <FormLabel>
                  <strong>{"Remaining"}</strong>
                </FormLabel>
                <InputGroup>
                  <Input value={amountToClaim ?? 0} disabled={true} />
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

              <Button isDisabled={allClaimed} colorScheme="blue" type="submit" isLoading={isLoading}>
                {allClaimed ? "Already claimed" : "Claim for all"}
              </Button>
            </VStack>
          </form>
        </VStack>
      </CardBody>
    </Card>
  )
}

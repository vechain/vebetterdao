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
} from "@chakra-ui/react"
import { useEffect, useMemo, useState } from "react"

export const ClaimXAppAllocations = () => {
  const [appId, setAppId] = useState<string | undefined>()
  const [roundId, setRoundId] = useState<number>(1)
  const [roundFieldIsDirty, setRoundFieldIsDirty] = useState(false)
  const [amountToClaim, setAmountToClaim] = useState<number>(0)

  const { data: xApps } = useXApps()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: claimableAmount } = useXAppClaimableAmount(appId ?? "", roundId?.toString() ?? "")
  const { data: isLastRoundFinalized } = useIsRoundFinalized(currentRoundId)
  const { data: claimed } = useHasXAppClaimed(appId ?? "", roundId?.toString() ?? "")

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
    if (claimableAmount !== undefined && !claimed) {
      setAmountToClaim(parseInt(claimableAmount))
    } else {
      setAmountToClaim(0)
    }
  }, [claimableAmount, appId])

  const isRoundValid = useMemo(() => {
    if (currentRoundId === undefined) return false
    return roundId && roundId > 0 && roundId <= parseInt(currentRoundId)
  }, [roundId, currentRoundId])

  const isFormValid = useMemo(() => isRoundValid && appId !== undefined && appId !== "", [appId, isRoundValid])

  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="md">Allocation claiming</Heading>
        <Text>
          Last round id: {currentRoundId} {`(${isLastRoundFinalized ? "finalized" : "not finalized"})`}
        </Text>
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
                <InputGroup>
                  <Input
                    placeholder="The number of the round"
                    type="number"
                    value={roundId}
                    onChange={e => {
                      setRoundId(parseInt(e.target.value || "0"))
                      setRoundFieldIsDirty(true)
                    }}
                    disabled={isLoading}
                  />
                </InputGroup>
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

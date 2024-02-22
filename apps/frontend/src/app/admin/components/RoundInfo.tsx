import { useAllocationsRound, useCurrentAllocationsRoundId, useIsRoundFinalized } from "@/api"
import { useDistributeEmission, useFinalizeRound } from "@/hooks"
import { VStack, HStack, Button, Text, Divider, Heading } from "@chakra-ui/react"
import { useMemo } from "react"

export const RoundInfo = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId)
  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === "0"
  }, [currentRound])
  const { data: isLastRoundFinalized } = useIsRoundFinalized(currentRoundId)

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useDistributeEmission({})
  const distributionLoading = isTxReceiptLoading || sendTransactionPending

  const {
    sendTransaction: sendFinalizeTx,
    isTxReceiptLoading: isFinalizeTxLoading,
    sendTransactionPending: isFinalizeTxPending,
  } = useFinalizeRound({
    roundId: currentRoundId?.toString() ?? "",
  })
  const isFinalizeLoading = isFinalizeTxLoading || isFinalizeTxPending

  if (parseInt(currentRoundId ?? "0") < 1) return null

  return (
    <VStack w="full" spacing={4}>
      <VStack w="full" spacing={4} alignItems="start">
        <VStack>
          <Text>
            {currentRound.voteEndTimestamp?.isBefore()
              ? `Last round (#${currentRoundId}) ended ${currentRound.voteEndTimestamp?.fromNow()}`
              : `Current round (#${currentRoundId}) will end in ${currentRound.voteEndTimestamp?.fromNow()}`}
          </Text>
        </VStack>
        <VStack>
          <Button
            colorScheme="blue"
            isDisabled={isCurrentRoundActive}
            onClick={() => sendTransaction(undefined)}
            isLoading={distributionLoading}>
            Start new round
          </Button>
        </VStack>
      </VStack>
      {!isLastRoundFinalized && (
        <>
          <Divider />

          <VStack w="full" spacing={4} alignItems="start">
            <VStack align={"start"}>
              <Heading size="sm">Last round not finalized!</Heading>
              <Text>
                Last round was not finalized yet. To allow claiming for the last round, please finalize it first by
                starting a new round or by manually finalizing it.
              </Text>
            </VStack>
            <HStack align={"end"}>
              <Button colorScheme="blue" onClick={() => sendFinalizeTx(undefined)} isLoading={isFinalizeLoading}>
                Finalize round #{currentRoundId}
              </Button>
            </HStack>
          </VStack>
        </>
      )}
    </VStack>
  )
}

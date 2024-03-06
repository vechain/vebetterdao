import { useB3trPaused, useVot3Paused } from "@/api"
import { useAccountPermissions } from "@/api/contracts/account"
import { useB3trBadgePaused } from "@/api/contracts/b3trBadge"
import { usePauseContract } from "@/hooks"
import { Button, HStack, VStack, Text, Show } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/dapp-kit-react"
import React, { useCallback } from "react"

export const Pause: React.FC = () => {
  const { account } = useWallet()
  const { isAdminOfB3tr, isAdminOfB3trBadge, isAdminOfVot3 } = useAccountPermissions(account ?? "")

  const { data: isB3trBadgePaused, isLoading: isB3trBadgePausedLoading } = useB3trBadgePaused()

  const { data: isVot3Paused, isLoading: isVot3PausedLoading } = useVot3Paused()

  const { data: isB3trPaused, isLoading: isB3trPausedLoading } = useB3trPaused()

  const { pauseTxResult: pauseB3trTxResult, unpauseTxResult: unpauseB3trTxResult } = usePauseContract({
    contract: getConfig().b3trContractAddress,
    contractName: "B3TR",
  })

  const { pauseTxResult: pauseVot3TxResult, unpauseTxResult: unpauseVot3TxResult } = usePauseContract({
    contract: getConfig().vot3ContractAddress,
    contractName: "VOT3",
  })

  const { pauseTxResult: pauseB3trBadgeTxResult, unpauseTxResult: unpauseB3trBadgeTxResult } = usePauseContract({
    contract: getConfig().nftBadgeContractAddress,
    contractName: "B3TR Badge",
  })

  const isToggleB3trPausedLoading =
    isB3trPausedLoading ||
    pauseB3trTxResult.isTxReceiptLoading ||
    unpauseB3trTxResult.isTxReceiptLoading ||
    pauseB3trTxResult.sendTransactionPending ||
    unpauseB3trTxResult.sendTransactionPending

  const isToggleVot3PausedLoading =
    isVot3PausedLoading ||
    pauseVot3TxResult.isTxReceiptLoading ||
    unpauseVot3TxResult.isTxReceiptLoading ||
    pauseVot3TxResult.sendTransactionPending ||
    unpauseVot3TxResult.sendTransactionPending

  const isToggleB3trBadgePausedLoading =
    isB3trBadgePausedLoading ||
    pauseB3trBadgeTxResult.isTxReceiptLoading ||
    unpauseB3trBadgeTxResult.isTxReceiptLoading ||
    pauseB3trBadgeTxResult.sendTransactionPending ||
    unpauseB3trBadgeTxResult.sendTransactionPending

  const handleToggleB3trPause = useCallback(() => {
    if (isB3trPaused) {
      unpauseB3trTxResult.sendTransaction()
    } else {
      pauseB3trTxResult.sendTransaction()
    }
  }, [isB3trPaused, pauseB3trTxResult, unpauseB3trTxResult])

  const handleToggleVot3Pause = useCallback(() => {
    if (isVot3Paused) {
      unpauseVot3TxResult.sendTransaction()
    } else {
      pauseVot3TxResult.sendTransaction()
    }
  }, [isVot3Paused, pauseVot3TxResult, unpauseVot3TxResult])

  const handleToggleB3trBadgePause = useCallback(() => {
    if (isB3trBadgePaused) {
      unpauseB3trBadgeTxResult.sendTransaction()
    } else {
      pauseB3trBadgeTxResult.sendTransaction()
    }
  }, [isB3trBadgePaused, pauseB3trBadgeTxResult, unpauseB3trBadgeTxResult])

  const pauseB3TR = (
    <>
      <Button
        colorScheme={`${isB3trPaused ? "blue" : "red"}`}
        onClick={handleToggleB3trPause}
        isLoading={isToggleB3trPausedLoading}>
        {isB3trPaused ? "Unpause B3TR" : "Pause B3TR"}
      </Button>
      <Text>Pausing disables: Transfers, Minting, New Emissions, Swaps</Text>
    </>
  )

  const pauseVOT3 = (
    <>
      <Button
        colorScheme={`${isVot3Paused ? "blue" : "red"}`}
        onClick={handleToggleVot3Pause}
        isLoading={isToggleVot3PausedLoading}>
        {isVot3Paused ? "Unpause VOT3" : "Pause VOT3"}
      </Button>
      <Text>Pausing disables: Transfers, Minting, Swaps, Delegation of voting power</Text>
    </>
  )

  const pauseB3trBadge = (
    <>
      <Button
        colorScheme={`${isB3trBadgePaused ? "blue" : "red"}`}
        onClick={handleToggleB3trBadgePause}
        isLoading={isToggleB3trBadgePausedLoading}>
        {isB3trBadgePaused ? "Unpause B3TR Badge" : "Pause B3TR Badge"}
      </Button>
      <Text>Pausing disables: Transfers, Minting</Text>
    </>
  )

  return (
    <VStack spacing={6} align={"flex-start"}>
      {isAdminOfVot3 && (
        <>
          <Show above="sm">
            <HStack>{pauseB3TR}</HStack>
          </Show>
          <Show below="sm">
            <VStack align={"flex-start"}>{pauseB3TR}</VStack>
          </Show>
        </>
      )}

      {isAdminOfB3tr && (
        <>
          <Show above="sm">
            <HStack>{pauseVOT3}</HStack>
          </Show>
          <Show below="sm">
            <VStack align={"flex-start"}>{pauseVOT3}</VStack>
          </Show>
        </>
      )}

      {isAdminOfB3trBadge && (
        <>
          <Show above="sm">
            <HStack>{pauseB3trBadge}</HStack>
          </Show>
          <Show below="sm">
            <VStack align={"flex-start"}>{pauseB3trBadge}</VStack>
          </Show>
        </>
      )}
    </VStack>
  )
}

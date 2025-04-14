import { useB3TRGovernorPaused, useB3trPaused, useVot3Paused } from "@/api"
import { useAccountPermissions } from "@/api/contracts/account"
import { useIsGMpaused } from "@/api/contracts/galaxyMember"
import { usePauseContract } from "@/hooks"
import { Button, HStack, VStack, Text, Show, Card, CardHeader, Heading, CardBody } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/vechain-kit"
import React, { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const Pause: React.FC = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")

  const { data: isGalaxyMemberPaused, isLoading: isGalaxyMemberPausedLoading } = useIsGMpaused()

  const { data: isVot3Paused, isLoading: isVot3PausedLoading } = useVot3Paused()

  const { data: isB3trPaused, isLoading: isB3trPausedLoading } = useB3trPaused()

  const { data: isB3TRGovernorPaused, isLoading: isB3TRGovernorPausedLoading } = useB3TRGovernorPaused()

  const { pauseTxResult: pauseB3trTxResult, unpauseTxResult: unpauseB3trTxResult } = usePauseContract({
    contract: getConfig().b3trContractAddress,
    contractName: "B3TR",
  })

  const { pauseTxResult: pauseVot3TxResult, unpauseTxResult: unpauseVot3TxResult } = usePauseContract({
    contract: getConfig().vot3ContractAddress,
    contractName: "VOT3",
  })

  const { pauseTxResult: pauseGalaxyMemberTxResult, unpauseTxResult: unpauseGalaxyMemberTxResult } = usePauseContract({
    contract: getConfig().galaxyMemberContractAddress,
    contractName: "Galaxy Member",
  })

  const { pauseTxResult: pauseB3TRGovernorTxResult, unpauseTxResult: unpauseB3TRGovernorTxResult } = usePauseContract({
    contract: getConfig().b3trGovernorAddress,
    contractName: "B3TRGovernor",
  })

  const isToggleB3trPausedLoading =
    isB3trPausedLoading ||
    pauseB3trTxResult.isTransactionPending ||
    unpauseB3trTxResult.isTransactionPending ||
    pauseB3trTxResult.status === "pending" ||
    unpauseB3trTxResult.status === "pending"

  const isToggleVot3PausedLoading =
    isVot3PausedLoading ||
    pauseVot3TxResult.isTransactionPending ||
    unpauseVot3TxResult.isTransactionPending ||
    pauseVot3TxResult.status === "pending" ||
    unpauseVot3TxResult.status === "pending"

  const isToggleGalaxyMemberPausedLoading =
    isGalaxyMemberPausedLoading ||
    pauseGalaxyMemberTxResult.isTransactionPending ||
    unpauseGalaxyMemberTxResult.isTransactionPending ||
    pauseGalaxyMemberTxResult.status === "pending" ||
    unpauseGalaxyMemberTxResult.status === "pending"

  const isToggleB3TRGovernorPausedLoading =
    isB3TRGovernorPausedLoading ||
    pauseB3TRGovernorTxResult.isTransactionPending ||
    unpauseB3TRGovernorTxResult.isTransactionPending ||
    pauseB3TRGovernorTxResult.status === "pending" ||
    unpauseB3TRGovernorTxResult.status === "pending"

  const handleToggleB3trPause = useCallback(() => {
    if (isB3trPaused) {
      unpauseB3trTxResult.sendTransaction(undefined)
    } else {
      pauseB3trTxResult.sendTransaction(undefined)
    }
  }, [isB3trPaused, pauseB3trTxResult, unpauseB3trTxResult])

  const handleToggleVot3Pause = useCallback(() => {
    if (isVot3Paused) {
      unpauseVot3TxResult.sendTransaction(undefined)
    } else {
      pauseVot3TxResult.sendTransaction(undefined)
    }
  }, [isVot3Paused, pauseVot3TxResult, unpauseVot3TxResult])

  const handleToggleGalaxyMemberPause = useCallback(() => {
    if (isGalaxyMemberPaused) {
      unpauseGalaxyMemberTxResult.sendTransaction(undefined)
    } else {
      pauseGalaxyMemberTxResult.sendTransaction(undefined)
    }
  }, [isGalaxyMemberPaused, pauseGalaxyMemberTxResult, unpauseGalaxyMemberTxResult])

  const handleToggleB3TRGovernorPause = useCallback(() => {
    if (isB3TRGovernorPaused) {
      unpauseB3TRGovernorTxResult.sendTransaction(undefined)
    } else {
      pauseB3TRGovernorTxResult.sendTransaction(undefined)
    }
  }, [isB3TRGovernorPaused, pauseB3TRGovernorTxResult, unpauseB3TRGovernorTxResult])

  const pauseB3TR = (
    <>
      <Button
        colorScheme={`${isB3trPaused ? "blue" : "red"}`}
        onClick={handleToggleB3trPause}
        isLoading={isToggleB3trPausedLoading}>
        {isB3trPaused ? "Unpause B3TR" : "Pause B3TR"}
      </Button>
      <Text>{t("Pausing disables: Transfers, Minting, New Emissions, Swaps")}</Text>
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
      <Text>{t("Pausing disables: Transfers, Minting, Swaps, Delegation of voting power")}</Text>
    </>
  )

  const pauseGalaxyMember = (
    <>
      <Button
        colorScheme={`${isGalaxyMemberPaused ? "blue" : "red"}`}
        onClick={handleToggleGalaxyMemberPause}
        isLoading={isToggleGalaxyMemberPausedLoading}>
        {isGalaxyMemberPaused ? "Unpause Galaxy Member" : "Pause Galaxy Member"}
      </Button>
      <Text>{t("Pausing disables: Transfers, Minting")}</Text>
    </>
  )

  const pauseB3TRGovernor = (
    <>
      <Button
        colorScheme={`${isB3TRGovernorPaused ? "blue" : "red"}`}
        onClick={handleToggleB3TRGovernorPause}
        isLoading={isToggleB3TRGovernorPausedLoading}>
        {isB3TRGovernorPaused ? "Unpause B3TRGovernor" : "Pause B3TRGovernor"}
      </Button>
      <Text>
        {t(
          "Pausing disables: Proposal creation, queuing and execution (from B3TRContract, still available from Timelock)",
        )}
      </Text>
    </>
  )

  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">{t("Pausing")}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align={"flex-start"}>
          {permissions?.isAdminOfVot3 && (
            <>
              <Show above="sm">
                <HStack>{pauseB3TR}</HStack>
              </Show>
              <Show below="sm">
                <VStack align={"flex-start"}>{pauseB3TR}</VStack>
              </Show>
            </>
          )}

          {permissions?.isAdminOfB3tr && (
            <>
              <Show above="sm">
                <HStack>{pauseVOT3}</HStack>
              </Show>
              <Show below="sm">
                <VStack align={"flex-start"}>{pauseVOT3}</VStack>
              </Show>
            </>
          )}

          {permissions?.isAdminOfGalaxyMember && (
            <>
              <Show above="sm">
                <HStack>{pauseGalaxyMember}</HStack>
              </Show>
              <Show below="sm">
                <VStack align={"flex-start"}>{pauseGalaxyMember}</VStack>
              </Show>
            </>
          )}

          {permissions?.isAdminOfB3TRGovernor && (
            <>
              <Show above="sm">
                <HStack>{pauseB3TRGovernor}</HStack>
              </Show>
              <Show below="sm">
                <VStack align={"flex-start"}>{pauseB3TRGovernor}</VStack>
              </Show>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

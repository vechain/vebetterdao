import { Button, HStack, VStack, Text, Card, Heading } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/vechain-kit"
import React, { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useAccountPermissions } from "../../../api/contracts/account/hooks/useAccountPermissions"
import { useB3trPaused } from "../../../api/contracts/b3tr/hooks/useB3trPaused"
import { useIsGMpaused } from "../../../api/contracts/galaxyMember/hooks/useIsGMpaused"
import { useB3TRGovernorPaused } from "../../../api/contracts/governance/hooks/useB3TRGovernorPaused"
import { useVot3Paused } from "../../../api/contracts/vot3/hooks/useVot3Paused"
import { usePauseContract } from "../../../hooks/usePauseContract"

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

  const handleToggleGalaxyMemberPause = useCallback(() => {
    if (isGalaxyMemberPaused) {
      unpauseGalaxyMemberTxResult.sendTransaction()
    } else {
      pauseGalaxyMemberTxResult.sendTransaction()
    }
  }, [isGalaxyMemberPaused, pauseGalaxyMemberTxResult, unpauseGalaxyMemberTxResult])

  const handleToggleB3TRGovernorPause = useCallback(() => {
    if (isB3TRGovernorPaused) {
      unpauseB3TRGovernorTxResult.sendTransaction()
    } else {
      pauseB3TRGovernorTxResult.sendTransaction()
    }
  }, [isB3TRGovernorPaused, pauseB3TRGovernorTxResult, unpauseB3TRGovernorTxResult])

  const pauseB3TR = (
    <>
      <Button
        colorPalette={`${isB3trPaused ? "blue" : "red"}`}
        onClick={handleToggleB3trPause}
        loading={isToggleB3trPausedLoading}>
        {isB3trPaused ? "Unpause B3TR" : "Pause B3TR"}
      </Button>
      <Text>{t("Pausing disables: Transfers, Minting, New Emissions, Swaps")}</Text>
    </>
  )

  const pauseVOT3 = (
    <>
      <Button
        colorPalette={`${isVot3Paused ? "blue" : "red"}`}
        onClick={handleToggleVot3Pause}
        loading={isToggleVot3PausedLoading}>
        {isVot3Paused ? "Unpause VOT3" : "Pause VOT3"}
      </Button>
      <Text>{t("Pausing disables: Transfers, Minting, Swaps, Delegation of voting power")}</Text>
    </>
  )

  const pauseGalaxyMember = (
    <>
      <Button
        colorPalette={`${isGalaxyMemberPaused ? "blue" : "red"}`}
        onClick={handleToggleGalaxyMemberPause}
        loading={isToggleGalaxyMemberPausedLoading}>
        {isGalaxyMemberPaused ? "Unpause Galaxy Member" : "Pause Galaxy Member"}
      </Button>
      <Text>{t("Pausing disables: Transfers, Minting")}</Text>
    </>
  )

  const pauseB3TRGovernor = (
    <>
      <Button
        colorPalette={`${isB3TRGovernorPaused ? "blue" : "red"}`}
        onClick={handleToggleB3TRGovernorPause}
        loading={isToggleB3TRGovernorPausedLoading}>
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
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="3xl">{t("Pausing")}</Heading>
      </Card.Header>
      <Card.Body>
        <VStack gap={6} align={"flex-start"}>
          {permissions?.isAdminOfVot3 && (
            <>
              <HStack hideBelow="sm">{pauseB3TR}</HStack>
              <VStack align={"flex-start"} hideFrom="sm">
                {pauseB3TR}
              </VStack>
            </>
          )}

          {permissions?.isAdminOfB3tr && (
            <>
              <HStack hideBelow="sm">{pauseVOT3}</HStack>
              <VStack align={"flex-start"} hideFrom="sm">
                {pauseVOT3}
              </VStack>
            </>
          )}

          {permissions?.isAdminOfGalaxyMember && (
            <>
              <HStack hideBelow="sm">{pauseGalaxyMember}</HStack>
              <VStack align={"flex-start"} hideFrom="sm">
                {pauseGalaxyMember}
              </VStack>
            </>
          )}

          {permissions?.isAdminOfB3TRGovernor && (
            <>
              <HStack hideBelow="sm">{pauseB3TRGovernor}</HStack>
              <VStack align={"flex-start"} hideFrom="sm">
                {pauseB3TRGovernor}
              </VStack>
            </>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

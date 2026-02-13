"use client"

import {
  Alert,
  Box,
  Button,
  Card,
  HStack,
  Heading,
  Icon,
  IconButton,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { ClockSolid, Minus, Plus } from "iconoir-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useAppEndorsementScore } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { useAppEndorsementStatus } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useCooldownPeriod } from "@/api/contracts/xApps/hooks/endorsement/useCooldownPeriod"
import { useMaxPointsPerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerApp"
import { useMaxPointsPerNodePerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerNodePerApp"
import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { AppImage } from "@/components/AppImage/AppImage"
import { BaseModal } from "@/components/BaseModal"
import { useEndorseApp } from "@/hooks/xApp/useEndorseApp"
import { useUnendorseApp } from "@/hooks/xApp/useUnendorseApp"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { XAppStatus } from "@/types/appDetails"

import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"
import { EndorsementStatusCallout } from "../../apps/[appId]/components/AppEndorsementInfoCard/EndorsementStatusCallout"

type Mode = "add" | "remove"

type Props = {
  isOpen: boolean
  onClose: () => void
  node: UserNode
  appId: string
  currentPoints: bigint
  endorsedAtRound: bigint
}

export const EditEndorsementModal = ({ isOpen, onClose, node, appId, currentPoints, endorsedAtRound }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: metadata } = useXAppMetadata(appId)
  const { data: endorsementScore } = useAppEndorsementScore(appId)
  const { status: endorsementStatus } = useAppEndorsementStatus(appId)
  const { data: maxPointsPerAppValue } = useMaxPointsPerApp()
  const { data: maxPointsPerNode } = useMaxPointsPerNodePerApp()
  const { data: cooldownPeriodData } = useCooldownPeriod()
  const { data: currentRoundStr } = useCurrentAllocationsRoundId()

  const [mode, setMode] = useState<Mode>("add")
  const [points, setPoints] = useState<string>("0")

  const nodeId = node.id.toString()
  const appScore = Number(endorsementScore ?? 0)
  const maxAppPoints = Number(maxPointsPerAppValue ?? 110)
  const appRemainingPoints = BigInt(Math.max(0, maxAppPoints - appScore))

  const cooldownRemainingRounds = useMemo(() => {
    const cooldownPeriod = cooldownPeriodData ?? BigInt(0)
    const currentRound = BigInt(currentRoundStr ?? 0)
    if (!endorsedAtRound || !cooldownPeriod || !currentRound) return BigInt(0)
    const cooldownEnd = endorsedAtRound + cooldownPeriod
    return currentRound >= cooldownEnd ? BigInt(0) : cooldownEnd - currentRound
  }, [endorsedAtRound, cooldownPeriodData, currentRoundStr])

  const isInCooldown = cooldownRemainingRounds > BigInt(0)

  const maxEndorsePoints = useMemo(() => {
    const cap = maxPointsPerNode ?? BigInt(49)
    const remainingNodeCap = cap - currentPoints
    const available = node.availablePoints
    const nodeMax = remainingNodeCap < available ? remainingNodeCap : available
    return nodeMax < appRemainingPoints ? nodeMax : appRemainingPoints
  }, [maxPointsPerNode, currentPoints, node.availablePoints, appRemainingPoints])

  const maxForCurrentMode = mode === "add" ? Number(maxEndorsePoints) : Number(currentPoints)

  const handleSuccess = useCallback(() => {
    setMode("add")
    setPoints("0")
    onClose()
  }, [onClose])

  const endorseAppMutation = useEndorseApp({
    appId,
    nodeId,
    points,
    userAddress: account?.address ?? "",
    onSuccess: handleSuccess,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Endorsement in progress...") },
      success: { title: t("Endorsement successful") },
      error: { title: t("Error endorsing app") },
    },
  })

  const unendorseAppMutation = useUnendorseApp({
    appId,
    nodeId,
    points,
    userAddress: account?.address ?? "",
    onSuccess: handleSuccess,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Removing endorsement...") },
      success: { title: t("Endorsement removed successfully") },
      error: { title: t("Error removing endorsement") },
    },
  })

  const handleClose = useCallback(() => {
    setMode("add")
    setPoints("0")
    onClose()
  }, [onClose])

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      if (newMode === "remove" && isInCooldown) return
      setMode(newMode)
      setPoints("0")
    },
    [isInCooldown],
  )

  const handlePointsChange = useCallback((details: { value: string; valueAsNumber: number }) => {
    setPoints(details.value || "0")
  }, [])

  const handleMaxPoints = useCallback(() => {
    setPoints(maxForCurrentMode.toString())
  }, [maxForCurrentMode])

  const handleSubmit = useCallback(() => {
    if (mode === "add") {
      endorseAppMutation.sendTransaction()
    } else {
      unendorseAppMutation.sendTransaction()
    }
  }, [mode, endorseAppMutation, unendorseAppMutation])

  const isSubmitDisabled = Number(points) <= 0

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} showCloseButton>
      <VStack gap={6} align="flex-start" w="full">
        <Heading size="xl" fontWeight="bold" lineClamp={1}>
          {t("Edit endorsement")}
        </Heading>

        <HStack gap={3} w="full" align="stretch">
          <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
            <Text textStyle="md" color="text.subtle">
              {t("Node")}
            </Text>
            <Text textStyle="md" fontWeight="semibold">
              {node.metadata?.name} {" #"}
              {nodeId}
            </Text>
          </VStack>
          <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
            <Text textStyle="md" color="text.subtle">
              {t("Available points")}
            </Text>
            <Text textStyle="md" fontWeight="semibold">
              {node.availablePoints.toString()} {t("pts")}
            </Text>
          </VStack>
          <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
            <Text textStyle="md" color="text.subtle">
              {t("Current endorsement")}
            </Text>
            <Text textStyle="md" fontWeight="semibold">
              {currentPoints.toString()} {t("pts")}
            </Text>
          </VStack>
        </HStack>

        <Card.Root variant="outline" w="full" p={6} rounded="xl">
          <VStack gap={4} align="stretch">
            <HStack justify="space-between" align="center">
              <HStack gap={3}>
                <AppImage appId={appId} boxSize="44px" borderRadius="lg" />
                <VStack gap={0.5} align="start">
                  <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
                    {metadata?.name ?? appId}
                  </Text>
                  <EndorsementStatusCallout
                    endorsementStatus={endorsementStatus as XAppStatus}
                    showDescription={false}
                    padding={1}
                    boxSize={4}
                    textStyle="xs"
                  />
                </VStack>
              </HStack>
              <VStack gap={0.5} align="end">
                <Text textStyle="md" color="text.subtle">
                  {t("Score")}
                </Text>
                <Text textStyle="md" fontWeight="semibold">
                  {appScore} {" / "} {maxAppPoints} {t("pts")}
                </Text>
              </VStack>
            </HStack>

            <HStack gap={2}>
              <Button
                flex={1}
                size="sm"
                variant={mode === "add" ? "primary" : "outline"}
                onClick={() => handleModeChange("add")}>
                <Plus strokeWidth={2} />
                {t("Add points")}
              </Button>
              <Button
                flex={1}
                size="sm"
                variant={mode === "remove" ? "primary" : "outline"}
                colorPalette={mode === "remove" ? "red" : undefined}
                onClick={() => handleModeChange("remove")}
                disabled={isInCooldown}>
                <Minus strokeWidth={2} />
                {t("Remove points")}
              </Button>
            </HStack>

            {isInCooldown && mode === "add" && (
              <HStack gap={1} textStyle="xs" color="fg.warning">
                <Icon as={ClockSolid} boxSize={3} />
                <Text>
                  {t("Points in cooldown: {{rounds}} rounds remaining", {
                    rounds: cooldownRemainingRounds.toString(),
                  })}
                </Text>
              </HStack>
            )}

            <NumberInput.Root
              value={points}
              onValueChange={handlePointsChange}
              min={0}
              max={maxForCurrentMode}
              step={1}
              clampValueOnBlur>
              <HStack gap={3}>
                <NumberInput.DecrementTrigger asChild>
                  <IconButton
                    aria-label={t("Decrease points")}
                    rounded="full"
                    color="actions.secondary.text"
                    bg="actions.secondary.default"
                    _hover={{ bg: "actions.secondary.hover" }}
                    size="xs"
                    boxSize={9}
                    p={1}
                    flexShrink={0}>
                    <Minus strokeWidth={2} />
                  </IconButton>
                </NumberInput.DecrementTrigger>
                <Box flex={12} position="relative">
                  <NumberInput.Input
                    placeholder="0"
                    textAlign="center"
                    borderRadius="xl"
                    h={9}
                    bg="bg.primary"
                    borderColor="border.primary"
                    borderWidth="1px"
                    pl={3}
                    pr={10}
                  />
                  <Box position="absolute" right={2.5} top="50%" transform="translateY(-50%)" pointerEvents="none">
                    <Text color="text.default" textStyle="md">
                      {t("pts")}
                    </Text>
                  </Box>
                </Box>
                <NumberInput.IncrementTrigger asChild>
                  <IconButton
                    aria-label={t("Increase points")}
                    rounded="full"
                    bg="actions.secondary.default"
                    _hover={{ bg: "actions.secondary.hover" }}
                    size="xs"
                    boxSize={9}
                    p={1}
                    flexShrink={0}>
                    <Plus strokeWidth={2} />
                  </IconButton>
                </NumberInput.IncrementTrigger>
                <Button
                  color="actions.secondary.text"
                  bg="actions.secondary.default"
                  _hover={{ bg: "actions.secondary.hover" }}
                  boxSize={9}
                  p={1}
                  onClick={handleMaxPoints}
                  mx="auto">
                  {t("Max")}
                </Button>
              </HStack>
            </NumberInput.Root>
          </VStack>
        </Card.Root>

        {mode === "remove" && (
          <Alert.Root status="warning" borderRadius="lg">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {t("Removing endorsement may cause this app to lose its eligibility for allocation rounds.")}
              </Alert.Title>
            </Alert.Content>
          </Alert.Root>
        )}

        <Button
          variant={mode === "add" ? "primary" : undefined}
          colorPalette={mode === "remove" ? "red" : undefined}
          w="full"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}>
          {mode === "add" ? t("Endorse now") : t("Remove endorsement")}
        </Button>
      </VStack>
    </BaseModal>
  )
}

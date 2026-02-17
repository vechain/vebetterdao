"use client"

import { Box, Button, Card, HStack, Heading, Icon, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { ClockSolid } from "iconoir-react"
import { useCallback, useEffect, useMemo, useState } from "react"
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
import { PointsSelector } from "@/components/PointsSelector/PointsSelector"
import { useEndorseApp } from "@/hooks/xApp/useEndorseApp"
import { useUnendorseApp } from "@/hooks/xApp/useUnendorseApp"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { XAppStatus } from "@/types/appDetails"

import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"
import { EndorsementStatusCallout } from "../../apps/[appId]/components/AppEndorsementInfoCard/EndorsementStatusCallout"

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

  const [points, setPoints] = useState<string>("0")

  useEffect(() => {
    if (isOpen) setPoints(currentPoints.toString())
  }, [isOpen, currentPoints])

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

  const minPoints = isInCooldown ? Number(currentPoints) : 0
  const maxPoints = Number(currentPoints) + Number(maxEndorsePoints)
  const pointsDelta = Math.abs(Number(points) - Number(currentPoints)).toString()
  const isRemoving = Number(points) < Number(currentPoints)

  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])

  const endorseAppMutation = useEndorseApp({
    appId,
    nodeId,
    points: pointsDelta,
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
    points: pointsDelta,
    userAddress: account?.address ?? "",
    onSuccess: handleSuccess,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Removing endorsement...") },
      success: { title: t("Endorsement removed successfully") },
      error: { title: t("Error removing endorsement") },
    },
  })

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(() => {
    if (isRemoving) {
      unendorseAppMutation.sendTransaction()
    } else {
      endorseAppMutation.sendTransaction()
    }
  }, [isRemoving, endorseAppMutation, unendorseAppMutation])

  const isSubmitDisabled = points === currentPoints.toString()

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

            {isInCooldown && (
              <HStack gap={1} textStyle="xs" color="fg.warning">
                <Icon as={ClockSolid} boxSize={3} />
                <Text>
                  {t("Points in cooldown: {{rounds}} rounds remaining", {
                    rounds: cooldownRemainingRounds.toString(),
                  })}
                </Text>
              </HStack>
            )}

            <Box mt={2}>
              <PointsSelector value={points} onChange={setPoints} min={minPoints} max={maxPoints} />
            </Box>
          </VStack>
        </Card.Root>

        <Button
          variant={isRemoving ? undefined : "primary"}
          colorPalette={isRemoving ? "red" : undefined}
          w="full"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}>
          {isRemoving ? t("Remove endorsement") : t("Endorse now")}
        </Button>
      </VStack>
    </BaseModal>
  )
}

import { VStack, Heading, Text, Button, Skeleton, Card, Image, HStack, Progress, Circle } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAppEndorsementScore } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { useAppEndorsementStatus } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useMaxPointsPerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerApp"
import { useMaxPointsPerNodePerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerNodePerApp"
import { useGetUserNodes, UserNode } from "@/api/contracts/xNodes/useGetUserNodes"
import { NodeAppEndorsementInfo } from "@/app/nodes/components/NodeAppEndorsementInfo"
import { AppImage } from "@/components/AppImage/AppImage"
import { BaseModal } from "@/components/BaseModal"
import { PointsSelector } from "@/components/PointsSelector/PointsSelector"
import { useEndorseApp } from "@/hooks/xApp/useEndorseApp"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { UnendorsedApp, XApp } from "../../../api/contracts/xApps/getXApps"
import { EndorsementStatusCallout } from "../[appId]/components/AppEndorsementInfoCard/EndorsementStatusCallout"

type Props = {
  isOpen: boolean
  onClose: () => void
  xApp: XApp | UnendorsedApp | undefined
}

export const EndorseAppModal = ({ xApp, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: userNodesInfo, isLoading: isUserNodesLoading } = useGetUserNodes()
  const { data: endorsementScore } = useAppEndorsementScore(xApp?.id ?? "")
  const { data: maxPointsPerNode } = useMaxPointsPerNodePerApp()
  const { data: maxPointsPerAppValue } = useMaxPointsPerApp()
  const { status: endorsementStatus } = useAppEndorsementStatus(xApp?.id ?? "")

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [points, setPoints] = useState<string>("0")

  const appScore = Number(endorsementScore ?? 0)
  const maxAppPoints = Number(maxPointsPerAppValue ?? 110)
  const appRemainingPoints = BigInt(Math.max(0, maxAppPoints - appScore))

  const allManagedNodes = useMemo(() => {
    return userNodesInfo?.nodesManagedByUser?.sort((a, b) => Number(b.availablePoints) - Number(a.availablePoints))
  }, [userNodesInfo])

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !allManagedNodes) return null
    return allManagedNodes.find(node => node.id.toString() === selectedNodeId) ?? null
  }, [selectedNodeId, allManagedNodes])

  const getNodeRemainingPoints = useCallback(
    (node: UserNode) => {
      const cap = maxPointsPerNode ?? BigInt(49)
      const currentForApp = node.activeEndorsements.find(e => e.appId === xApp?.id)?.points ?? BigInt(0)
      const remainingNodeCap = cap - currentForApp
      const available = node.availablePoints
      const nodeMax = remainingNodeCap < available ? remainingNodeCap : available
      return nodeMax < appRemainingPoints ? nodeMax : appRemainingPoints
    },
    [maxPointsPerNode, xApp?.id, appRemainingPoints],
  )

  const currentPointsForApp = useMemo(() => {
    if (!selectedNode || !xApp?.id) return BigInt(0)
    return selectedNode.activeEndorsements.find(e => e.appId === xApp.id)?.points ?? BigInt(0)
  }, [selectedNode, xApp?.id])

  const maxEndorsePoints = useMemo(() => {
    if (!selectedNode) return BigInt(0)
    const cap = maxPointsPerNode ?? BigInt(49)
    const remainingNodeCap = cap - currentPointsForApp
    const available = selectedNode.availablePoints
    const nodeMax = remainingNodeCap < available ? remainingNodeCap : available
    return nodeMax < appRemainingPoints ? nodeMax : appRemainingPoints
  }, [selectedNode, maxPointsPerNode, currentPointsForApp, appRemainingPoints])

  const handleSuccess = useCallback(() => {
    setStep(1)
    setSelectedNodeId(null)
    setPoints("0")
    onClose()
  }, [onClose])

  const endorseAppMutation = useEndorseApp({
    appId: xApp?.id ?? "",
    nodeId: selectedNodeId ?? "",
    points,
    userAddress: account?.address ?? "",
    onSuccess: handleSuccess,
    transactionModalCustomUI: {
      waitingConfirmation: {
        title: t("Endorsement in progress..."),
      },
      success: {
        title: t("Endorsement successful"),
      },
      error: {
        title: t("Error endorsing app"),
      },
    },
  })

  const handleClose = useCallback(() => {
    setStep(1)
    setSelectedNodeId(null)
    setPoints("0")
    onClose()
  }, [onClose])

  const handleNodeSelect = useCallback((value: string | null) => {
    setSelectedNodeId(value)
  }, [])

  const handleNextStep = useCallback(() => {
    if (selectedNodeId) setStep(2)
  }, [selectedNodeId])

  const handleBack = useCallback(() => {
    setStep(1)
    setPoints("0")
  }, [])

  const handleEndorsement = useCallback(() => {
    endorseAppMutation.sendTransaction()
  }, [endorseAppMutation])

  const isEndorseDisabled = Number(points) <= 0

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} showCloseButton>
      {step === 1 ? (
        <VStack gap={6} align="flex-start" w="full">
          <Heading size="xl" fontWeight="bold" lineClamp={1}>
            {t("Endorse {{appName}}", { appName: xApp?.name })}
          </Heading>

          <Text textStyle="lg" fontWeight="semibold">
            {t("Select node")}
          </Text>

          <VStack w="full" alignItems="stretch" gap={3}>
            <Skeleton loading={isUserNodesLoading}>
              <VStack w="full" gap={3} alignItems="stretch" maxH="400px" overflowY="auto">
                {allManagedNodes?.map((node: UserNode) => {
                  const nodeId = node.id.toString()
                  const isSelected = selectedNodeId === nodeId
                  const remaining = getNodeRemainingPoints(node)
                  const appAtMaxCapacity = appRemainingPoints <= BigInt(0)
                  const disabled = remaining <= BigInt(0) || appAtMaxCapacity
                  const noAvailablePoints = node.availablePoints <= BigInt(0)
                  const usedPoints = node.endorsementScore - node.availablePoints
                  const totalPoints = node.endorsementScore
                  const progressPercent = totalPoints > 0 ? Number((usedPoints * BigInt(100)) / totalPoints) : 0

                  return (
                    <Card.Root
                      key={nodeId}
                      variant="outline"
                      p={4}
                      rounded="xl"
                      cursor={disabled ? "not-allowed" : "pointer"}
                      opacity={disabled ? 0.5 : 1}
                      borderColor={isSelected ? "actions.primary.default" : undefined}
                      onClick={() => !disabled && handleNodeSelect(nodeId)}>
                      <VStack w="full" gap={3}>
                        <HStack w="full" justifyContent="space-between" alignItems="center" gap={4}>
                          <HStack gap={3} flex={1}>
                            <Circle
                              size={5}
                              borderWidth={2}
                              borderColor={isSelected ? "actions.primary.default" : "border.primary"}
                              bg={isSelected ? "actions.primary.default" : "transparent"}
                              flexShrink={0}
                            />
                            <Image
                              src={node.metadata?.image}
                              alt={node.metadata?.name}
                              boxSize="44px"
                              rounded="lg"
                              objectFit="cover"
                            />
                            <VStack gap={1} align="start">
                              <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
                                {node.metadata?.name}
                              </Text>
                              <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
                                {node.type}
                                {" #"}
                                {nodeId}
                              </Text>
                            </VStack>
                          </HStack>
                          <VStack gap={2} align="end" minW="270px" display={{ base: "none", md: "flex" }}>
                            <HStack w="full" justify="space-between" textStyle="sm" fontWeight="semibold">
                              <HStack gap={1}>
                                <Text color="text.subtle">{t("Used points:")}</Text>
                                <Text>{usedPoints.toString()}</Text>
                              </HStack>
                              <HStack gap={1}>
                                <Text color="text.subtle">{t("Available points:")}</Text>
                                <Text>{node.availablePoints.toString()}</Text>
                              </HStack>
                            </HStack>
                            <Progress.Root value={progressPercent} w="full" size="xs" colorPalette="green">
                              <Progress.Track borderRadius="full">
                                <Progress.Range borderRadius="full" />
                              </Progress.Track>
                            </Progress.Root>
                            {disabled && (
                              <Text textStyle="xs" color="fg.error">
                                {appAtMaxCapacity
                                  ? t("App has reached maximum endorsement points")
                                  : noAvailablePoints
                                    ? t("No available points")
                                    : t("Max points reached for this app")}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        <VStack gap={2} align="stretch" w="full" display={{ base: "flex", md: "none" }}>
                          <HStack w="full" justify="space-between" textStyle="sm" fontWeight="semibold">
                            <HStack gap={1}>
                              <Text color="text.subtle">{t("Used points:")}</Text>
                              <Text>{usedPoints.toString()}</Text>
                            </HStack>
                            <HStack gap={1}>
                              <Text color="text.subtle">{t("Available points:")}</Text>
                              <Text>{node.availablePoints.toString()}</Text>
                            </HStack>
                          </HStack>
                          <Progress.Root value={progressPercent} w="full" size="xs" colorPalette="green">
                            <Progress.Track borderRadius="full">
                              <Progress.Range borderRadius="full" />
                            </Progress.Track>
                          </Progress.Root>
                          {disabled && (
                            <Text textStyle="xs" color="fg.error">
                              {appAtMaxCapacity
                                ? t("App has reached maximum endorsement points")
                                : noAvailablePoints
                                  ? t("No available points")
                                  : t("Max points reached for this app")}
                            </Text>
                          )}
                        </VStack>
                      </VStack>
                    </Card.Root>
                  )
                })}
              </VStack>
            </Skeleton>
          </VStack>

          <Button variant="primary" w="full" onClick={handleNextStep} disabled={!selectedNodeId}>
            {t("Continue")}
          </Button>
        </VStack>
      ) : (
        <VStack gap={6} align="flex-start" w="full">
          <Heading size="xl" fontWeight="bold" lineClamp={1}>
            {t("Endorse {{appName}}", { appName: xApp?.name })}
          </Heading>

          <NodeAppEndorsementInfo node={selectedNode} currentPoints={currentPointsForApp} />

          <Card.Root variant="outline" w="full" p={6} rounded="xl">
            <VStack gap={2} align="stretch">
              <HStack justify="space-between" align="center">
                <HStack gap={3}>
                  <AppImage appId={xApp?.id ?? ""} boxSize="44px" borderRadius="lg" />
                  <VStack gap={0.5} align="start">
                    <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
                      {xApp?.name}
                    </Text>
                    <HStack gap={2}>
                      <EndorsementStatusCallout
                        endorsementStatus={endorsementStatus}
                        showDescription={false}
                        padding={1}
                        boxSize={4}
                        textStyle="xs"
                      />
                    </HStack>
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

              <VStack gap={2} align="stretch" mt={6}>
                <Text textStyle="sm" fontWeight="semibold" color="text.subtle">
                  {t("Add points")}
                </Text>
                <PointsSelector value={points} onChange={setPoints} max={Number(maxEndorsePoints)} />
              </VStack>
            </VStack>
          </Card.Root>

          <HStack gap={4} justify="stretch" w="full" align="center" p={0}>
            <Button variant="secondary" flex={1} onClick={handleBack}>
              {t("Back")}
            </Button>
            <Button variant="primary" flex={1} onClick={handleEndorsement} disabled={isEndorseDisabled}>
              {t("Endorse now")}
            </Button>
          </HStack>
        </VStack>
      )}
    </BaseModal>
  )
}

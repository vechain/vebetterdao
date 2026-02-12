import {
  VStack,
  Heading,
  Box,
  Text,
  Button,
  Skeleton,
  Card,
  Image,
  HStack,
  NumberInput,
  IconButton,
  Progress,
  Circle,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { Minus, Plus } from "iconoir-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAppEndorsementScore } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { useAppEndorsementStatus } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useMaxPointsPerNodePerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerNodePerApp"
import { useEndorsementScoreThreshold } from "@/api/contracts/xApps/hooks/useEndorsementScoreThreshold"
import { useGetUserNodes, UserNode } from "@/api/contracts/xNodes/useGetUserNodes"
import { AppImage } from "@/components/AppImage/AppImage"
import { BaseModal } from "@/components/BaseModal"
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
  const { data: thresholdStr } = useEndorsementScoreThreshold()
  const { data: maxPointsPerNode } = useMaxPointsPerNodePerApp()
  const { status: endorsementStatus } = useAppEndorsementStatus(xApp?.id ?? "")

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [points, setPoints] = useState<string>("0")

  const threshold = Number(thresholdStr ?? 100)
  const appScore = Number(endorsementScore ?? 0)

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
      const remainingCap = cap - currentForApp
      const available = node.availablePoints
      return remainingCap < available ? remainingCap : available
    },
    [maxPointsPerNode, xApp?.id],
  )

  const currentPointsForApp = useMemo(() => {
    if (!selectedNode || !xApp?.id) return BigInt(0)
    return selectedNode.activeEndorsements.find(e => e.appId === xApp.id)?.points ?? BigInt(0)
  }, [selectedNode, xApp?.id])

  const maxEndorsePoints = useMemo(() => {
    if (!selectedNode) return BigInt(0)
    const cap = maxPointsPerNode ?? BigInt(49)
    const remaining = cap - currentPointsForApp
    const available = selectedNode.availablePoints
    return remaining < available ? remaining : available
  }, [selectedNode, maxPointsPerNode, currentPointsForApp])

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

  const handleMaxPoints = useCallback(() => {
    setPoints(maxEndorsePoints.toString())
  }, [maxEndorsePoints])

  const handlePointsChange = useCallback((details: { value: string; valueAsNumber: number }) => {
    setPoints(details.value || "0")
  }, [])

  const isEndorseDisabled = Number(points) <= 0

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} showCloseButton>
      {step === 1 ? (
        <VStack gap={6} align="flex-start" w="full">
          <Heading size="xl" fontWeight="bold">
            {t("Endorse app")}
          </Heading>

          <Text textStyle="lg" fontWeight="semibold">
            {t("Select node")}
          </Text>

          <VStack w="full" alignItems="stretch" gap={3}>
            <Skeleton loading={isUserNodesLoading}>
              <VStack w="full" gap={3} alignItems="stretch">
                {allManagedNodes?.map((node: UserNode) => {
                  const nodeId = node.id.toString()
                  const isSelected = selectedNodeId === nodeId
                  const remaining = getNodeRemainingPoints(node)
                  const disabled = remaining <= BigInt(0)
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
                                {noAvailablePoints ? t("No available points") : t("Max points reached for this app")}
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
                              {noAvailablePoints ? t("No available points") : t("Max points reached for this app")}
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

          <HStack gap={3} w="full" align="stretch">
            <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
              <Text textStyle="md" color="text.subtle">
                {t("Node")}
              </Text>
              <HStack gap={2}>
                <Image
                  src={selectedNode?.metadata?.image}
                  alt={selectedNode?.metadata?.name}
                  boxSize="24px"
                  rounded="sm"
                  objectFit="cover"
                />
                <Text textStyle="md" fontWeight="semibold">
                  {selectedNode?.metadata?.name}
                  {" #" + selectedNode?.id.toString()}
                </Text>
              </HStack>
            </VStack>
            <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
              <Text textStyle="md" color="text.subtle">
                {t("Available points")}
              </Text>
              <Text textStyle="md" fontWeight="semibold">
                {selectedNode?.availablePoints.toString()} {t("pts")}
              </Text>
            </VStack>
          </HStack>

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
                    {t("Current score")}
                  </Text>
                  <Text textStyle="md" fontWeight="semibold">
                    {appScore} {" / "} {threshold} {t("pts")}
                  </Text>
                </VStack>
              </HStack>

              <VStack gap={2} align="stretch" mt={4}>
                <Text textStyle="sm" fontWeight="semibold" color="text.subtle">
                  {t("Add points")}
                </Text>

                <NumberInput.Root
                  value={points}
                  onValueChange={handlePointsChange}
                  min={0}
                  max={Number(maxEndorsePoints)}
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

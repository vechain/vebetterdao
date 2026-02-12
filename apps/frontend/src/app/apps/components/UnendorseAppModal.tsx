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
  Alert,
  Icon,
  Circle,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { ClockSolid, Minus, Plus } from "iconoir-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useAppEndorsementScore } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { useAppEndorsementStatus } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useCooldownPeriod } from "@/api/contracts/xApps/hooks/endorsement/useCooldownPeriod"
import { useEndorsementScoreThreshold } from "@/api/contracts/xApps/hooks/useEndorsementScoreThreshold"
import { useGetUserNodes, UserNode } from "@/api/contracts/xNodes/useGetUserNodes"
import { AppImage } from "@/components/AppImage/AppImage"
import { BaseModal } from "@/components/BaseModal"
import { useUnendorseApp } from "@/hooks/xApp/useUnendorseApp"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { EndorsementStatusCallout } from "../[appId]/components/AppEndorsementInfoCard/EndorsementStatusCallout"

type Props = {
  isOpen: boolean
  onClose: () => void
  appId: string
  appName: string
}

export const UnendorseAppModal = ({ appId: appIdProp, appName, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: userNodesInfo, isLoading: isUserNodesLoading } = useGetUserNodes()
  const { data: endorsementScore } = useAppEndorsementScore(appIdProp)
  const { data: thresholdStr } = useEndorsementScoreThreshold()
  const { data: cooldownPeriodData } = useCooldownPeriod()
  const { data: currentRoundStr } = useCurrentAllocationsRoundId()
  const { status: endorsementStatus } = useAppEndorsementStatus(appIdProp)

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [points, setPoints] = useState<string>("0")

  const threshold = Number(thresholdStr ?? 100)
  const appScore = Number(endorsementScore ?? 0)
  const cooldownPeriod = cooldownPeriodData ?? BigInt(0)
  const currentRound = BigInt(currentRoundStr ?? 0)

  const nodesEndorsingApp = useMemo(() => {
    return userNodesInfo?.nodesManagedByUser?.filter((node: UserNode) =>
      node.activeEndorsements.some(e => e.appId === appIdProp),
    )
  }, [userNodesInfo, appIdProp])

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !nodesEndorsingApp) return null
    return nodesEndorsingApp.find(node => node.id.toString() === selectedNodeId) ?? null
  }, [selectedNodeId, nodesEndorsingApp])

  const getEndorsementForApp = useCallback(
    (node: UserNode) => {
      return node.activeEndorsements.find(e => e.appId === appIdProp)
    },
    [appIdProp],
  )

  const getCooldownRemainingRounds = useCallback(
    (node: UserNode) => {
      const endorsement = getEndorsementForApp(node)
      if (!endorsement) return BigInt(0)
      const cooldownEnd = endorsement.endorsedAtRound + cooldownPeriod
      return currentRound >= cooldownEnd ? BigInt(0) : cooldownEnd - currentRound
    },
    [getEndorsementForApp, cooldownPeriod, currentRound],
  )

  const currentPointsForApp = useMemo(() => {
    if (!selectedNode || !appIdProp) return BigInt(0)
    return getEndorsementForApp(selectedNode)?.points ?? BigInt(0)
  }, [selectedNode, appIdProp, getEndorsementForApp])

  const handleSuccess = useCallback(() => {
    setStep(1)
    setSelectedNodeId(null)
    setPoints("0")
    onClose()
  }, [onClose])

  const unendorseAppMutation = useUnendorseApp({
    appId: appIdProp,
    nodeId: selectedNodeId ?? "",
    points,
    userAddress: account?.address ?? "",
    onSuccess: handleSuccess,
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

  const handleUnendorsement = useCallback(() => {
    unendorseAppMutation.sendTransaction()
  }, [unendorseAppMutation])

  const handleMaxPoints = useCallback(() => {
    setPoints(currentPointsForApp.toString())
  }, [currentPointsForApp])

  const handlePointsChange = useCallback((details: { value: string; valueAsNumber: number }) => {
    setPoints(details.value || "0")
  }, [])

  const isUnendorseDisabled = Number(points) <= 0

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} showCloseButton>
      {step === 1 ? (
        <VStack gap={6} align="flex-start" w="full">
          <Heading size="xl" fontWeight="bold">
            {t("Remove endorsement")}
          </Heading>

          <Text textStyle="lg" fontWeight="semibold">
            {t("Select node")}
          </Text>

          <VStack w="full" alignItems="stretch" gap={3}>
            <Skeleton loading={isUserNodesLoading}>
              <VStack w="full" gap={3} alignItems="stretch">
                {nodesEndorsingApp?.map((node: UserNode) => {
                  const nodeId = node.id.toString()
                  const isSelected = selectedNodeId === nodeId
                  const endorsement = getEndorsementForApp(node)
                  const endorsedPoints = endorsement?.points ?? BigInt(0)
                  const remainingRounds = getCooldownRemainingRounds(node)
                  const isUnderCooldown = remainingRounds > BigInt(0)

                  return (
                    <Card.Root
                      key={nodeId}
                      variant="outline"
                      p={4}
                      rounded="xl"
                      cursor={isUnderCooldown ? "not-allowed" : "pointer"}
                      opacity={isUnderCooldown ? 0.5 : 1}
                      borderColor={isSelected ? "actions.primary.default" : undefined}
                      onClick={() => !isUnderCooldown && handleNodeSelect(nodeId)}>
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
                        <VStack gap={2} align="end">
                          <Text textStyle="md" color="text.subtle">
                            {t("Endorsed with")}
                          </Text>
                          <Text textStyle="md" fontWeight="semibold">
                            {endorsedPoints.toString()} {t("pts")}
                          </Text>
                          {isUnderCooldown && (
                            <HStack gap={1} textStyle="xs" color="fg.warning">
                              <Icon as={ClockSolid} boxSize={3} />
                              <Text>
                                {t("Cooldown: {{rounds}} rounds left", {
                                  rounds: remainingRounds.toString(),
                                })}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </HStack>
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
            {t("Unendorse {{appName}}", { appName: appName })}
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
                {t("Endorsed points")}
              </Text>
              <Text textStyle="md" fontWeight="semibold">
                {currentPointsForApp.toString()} {t("pts")}
              </Text>
            </VStack>
          </HStack>

          <Card.Root variant="outline" w="full" p={6} rounded="xl">
            <VStack gap={2} align="stretch">
              <HStack justify="space-between" align="center">
                <HStack gap={3}>
                  <AppImage appId={appIdProp} boxSize="44px" borderRadius="lg" />
                  <VStack gap={0.5} align="start">
                    <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
                      {appName}
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
                  {t("Remove points")}
                </Text>

                <NumberInput.Root
                  value={points}
                  onValueChange={handlePointsChange}
                  min={0}
                  max={Number(currentPointsForApp)}
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

          <Alert.Root status="warning" borderRadius="lg">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {t("Removing endorsement may cause this app to lose its eligibility for allocation rounds.")}
              </Alert.Title>
            </Alert.Content>
          </Alert.Root>

          <HStack gap={4} justify="stretch" w="full" align="center" p={0}>
            <Button variant="secondary" flex={1} onClick={handleBack}>
              {t("Back")}
            </Button>
            <Button colorPalette="red" flex={1} onClick={handleUnendorsement} disabled={isUnendorseDisabled}>
              {t("Unendorse now")}
            </Button>
          </HStack>
        </VStack>
      )}
    </BaseModal>
  )
}

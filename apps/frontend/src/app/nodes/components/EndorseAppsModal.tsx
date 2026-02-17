"use client"

import { Box, Button, Card, HStack, Heading, Icon, Image, Input, NativeSelect, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuSearch, LuUsers } from "react-icons/lu"

import { useAppEndorsementScore } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { useAppEndorsementStatus } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useAppEndorsers } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsers"
import { useMaxPointsPerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerApp"
import { useMaxPointsPerNodePerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerNodePerApp"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { AppImage } from "@/components/AppImage/AppImage"
import { BaseModal } from "@/components/BaseModal"
import { PointsSelector } from "@/components/PointsSelector/PointsSelector"
import { useDebounce } from "@/hooks/useDebounce"
import { useEndorseApp } from "@/hooks/xApp/useEndorseApp"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { XAppStatus } from "@/types/appDetails"

import { AllApps } from "../../../api/contracts/xApps/getXApps"
import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"
import { EndorsementStatusCallout } from "../../apps/[appId]/components/AppEndorsementInfoCard/EndorsementStatusCallout"

type EndorseStatusFilter = "all" | XAppStatus

type Props = {
  isOpen: boolean
  onClose: () => void
  node: UserNode
}

const SelectableAppRow = ({
  app,
  node,
  isSelected,
  onSelect,
}: {
  app: AllApps
  node: UserNode
  isSelected: boolean
  onSelect: () => void
}) => {
  const { t } = useTranslation()
  const { status: endorsementStatus, score } = useAppEndorsementStatus(app.id)
  const { data: rawEndorsers } = useAppEndorsers(app.id)
  const { data: maxPointsPerApp } = useMaxPointsPerApp()
  const { data: maxPointsPerNode } = useMaxPointsPerNodePerApp()

  const uniqueEndorsersCount = useMemo(() => {
    if (!rawEndorsers) return 0
    return new Set(rawEndorsers.map(a => a.toLowerCase())).size
  }, [rawEndorsers])

  const { isMaxed, reason } = useMemo(() => {
    const currentForApp = node.activeEndorsements.find(e => e.appId === app.id)?.points ?? BigInt(0)
    if (currentForApp <= BigInt(0)) return { isMaxed: false, reason: "" }

    const cap = maxPointsPerNode ?? BigInt(49)
    const appMax = maxPointsPerApp ?? BigInt(110)
    const appScore = BigInt(score ?? 0)

    if (currentForApp >= cap) return { isMaxed: true, reason: t("Node cap reached") }
    if (appScore >= appMax) return { isMaxed: true, reason: t("App cap reached") }
    if (node.availablePoints <= BigInt(0)) return { isMaxed: true, reason: t("No available points") }

    return { isMaxed: false, reason: "" }
  }, [node, app.id, maxPointsPerNode, maxPointsPerApp, score, t])

  return (
    <Card.Root
      variant="outline"
      p={4}
      rounded="xl"
      cursor={isMaxed ? "not-allowed" : "pointer"}
      opacity={isMaxed ? 0.5 : 1}
      borderColor={isSelected ? "actions.primary.default" : undefined}
      borderWidth={isSelected ? "2px" : "1px"}
      onClick={() => !isMaxed && onSelect()}>
      <VStack gap={2} align="stretch">
        <HStack gap={3} w="full" align="center">
          <AppImage appId={app.id} boxSize="44px" borderRadius="lg" flexShrink={0} />
          <Text textStyle="md" fontWeight="semibold" lineClamp={1} flex={1} minW={0}>
            {app.name}
          </Text>
        </HStack>
        <HStack gap={2} align="center" justify="space-between">
          <VStack gap={2} align="center">
            <EndorsementStatusCallout
              endorsementStatus={endorsementStatus as XAppStatus}
              appId={app.id}
              showDescription={false}
              padding={1}
              boxSize={4}
              textStyle="xs"
              flex="0"
              whiteSpace="nowrap"
            />
            {isMaxed && (
              <Text textStyle="xs" color="fg.error" bg="bg.error" px={2} py={0.5} rounded="md" whiteSpace="nowrap">
                {reason}
              </Text>
            )}
          </VStack>

          <HStack gap={2} align="center">
            <HStack gap={2} flexShrink={0} borderLeftWidth="1px" borderColor="border" pl={3}>
              <Icon as={LuUsers} boxSize={4} color="text.subtle" />
              <Text textStyle="sm" color="text.subtle">
                {uniqueEndorsersCount}
              </Text>
            </HStack>
            <Text textStyle="sm" color="text.subtle" flexShrink={0} borderLeftWidth="1px" borderColor="border" pl={3}>
              {score ?? "0"} {" / "} {maxPointsPerApp?.toString() ?? "0"} {t("pts")}
            </Text>
          </HStack>
        </HStack>
      </VStack>
    </Card.Root>
  )
}

const EndorsementStep = ({
  node,
  appId,
  appName,
  onBack,
  onSuccess,
}: {
  node: UserNode
  appId: string
  appName: string
  onBack: () => void
  onSuccess: () => void
}) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: endorsementScore } = useAppEndorsementScore(appId)
  const { status: endorsementStatus } = useAppEndorsementStatus(appId)
  const { data: maxPointsPerAppValue } = useMaxPointsPerApp()
  const { data: maxPointsPerNode } = useMaxPointsPerNodePerApp()

  const [points, setPoints] = useState<string>("0")

  const nodeId = node.id.toString()
  const appScore = Number(endorsementScore ?? 0)
  const maxAppPoints = Number(maxPointsPerAppValue ?? 110)
  const appRemainingPoints = BigInt(Math.max(0, maxAppPoints - appScore))

  const currentPointsForApp = useMemo(() => {
    return node.activeEndorsements.find(e => e.appId === appId)?.points ?? BigInt(0)
  }, [node.activeEndorsements, appId])

  const maxEndorsePoints = useMemo(() => {
    const cap = maxPointsPerNode ?? BigInt(49)
    const remainingNodeCap = cap - currentPointsForApp
    const available = node.availablePoints
    const nodeMax = remainingNodeCap < available ? remainingNodeCap : available
    return nodeMax < appRemainingPoints ? nodeMax : appRemainingPoints
  }, [maxPointsPerNode, currentPointsForApp, node.availablePoints, appRemainingPoints])

  const endorseAppMutation = useEndorseApp({
    appId,
    nodeId,
    points,
    userAddress: account?.address ?? "",
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Endorsement in progress...") },
      success: { title: t("Endorsement successful"), onSuccess },
      error: { title: t("Error endorsing app") },
    },
  })

  const handleEndorsement = useCallback(() => {
    endorseAppMutation.sendTransaction()
  }, [endorseAppMutation])

  const isEndorseDisabled = Number(points) <= 0

  return (
    <VStack gap={6} align="flex-start" w="full">
      <Heading size="xl" fontWeight="bold" lineClamp={1}>
        {t("Endorse {{appName}}", { appName })}
      </Heading>

      <HStack gap={3} w="full" align="stretch">
        <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
          <Text textStyle="md" color="text.subtle">
            {t("Node")}
          </Text>
          <HStack gap={2}>
            <Image src={node.metadata?.image} alt={node.metadata?.name} boxSize="24px" rounded="sm" objectFit="cover" />
            <Text textStyle="md" fontWeight="semibold">
              {node.metadata?.name} {" #"}
              {nodeId}
            </Text>
          </HStack>
        </VStack>
        <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
          <Text textStyle="md" color="text.subtle">
            {t("Available points")}
          </Text>
          <Text textStyle="md" fontWeight="semibold">
            {node.availablePoints.toString()} {t("pts")}
          </Text>
        </VStack>
        {currentPointsForApp > BigInt(0) && (
          <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
            <Text textStyle="md" color="text.subtle">
              {t("Current endorsement")}
            </Text>
            <Text textStyle="md" fontWeight="semibold">
              {currentPointsForApp.toString()} {t("pts")}
            </Text>
          </VStack>
        )}
      </HStack>

      <Card.Root variant="outline" w="full" p={6} rounded="xl">
        <VStack gap={2} align="stretch">
          <HStack justify="space-between" align="center">
            <HStack gap={3}>
              <AppImage appId={appId} boxSize="44px" borderRadius="lg" />
              <VStack gap={0.5} align="start">
                <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
                  {appName}
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

          <VStack gap={2} align="stretch" mt={6}>
            <Text textStyle="sm" fontWeight="semibold" color="text.subtle">
              {t("Add points")}
            </Text>
            <PointsSelector value={points} onChange={setPoints} max={Number(maxEndorsePoints)} />
          </VStack>
        </VStack>
      </Card.Root>

      <HStack gap={4} justify="stretch" w="full" align="center" p={0}>
        <Button variant="secondary" flex={1} onClick={onBack}>
          {t("Back")}
        </Button>
        <Button variant="primary" flex={1} onClick={handleEndorsement} disabled={isEndorseDisabled}>
          {t("Endorse now")}
        </Button>
      </HStack>
    </VStack>
  )
}

export const EndorseAppsModal = ({ isOpen, onClose, node }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { data: xAppsData } = useXApps({ filterBlacklisted: true })

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<EndorseStatusFilter>("all")
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { uniqueApps, appStatusMap } = useMemo(() => {
    if (!xAppsData) return { uniqueApps: [], appStatusMap: new Map<string, XAppStatus>() }

    const seen = new Set<string>()
    const uniqueApps: AllApps[] = []
    for (const app of xAppsData.allApps) {
      if (seen.has(app.id)) continue
      seen.add(app.id)
      uniqueApps.push(app)
    }

    const appStatusMap = new Map<string, XAppStatus>()
    for (const app of xAppsData.endorsed) appStatusMap.set(app.id, XAppStatus.ENDORSED_AND_ELIGIBLE)
    for (const app of xAppsData.gracePeriod) appStatusMap.set(app.id, XAppStatus.UNENDORSED_AND_ELIGIBLE)
    for (const app of xAppsData.endorsementLost) appStatusMap.set(app.id, XAppStatus.UNENDORSED_NOT_ELIGIBLE)
    for (const app of xAppsData.newLookingForEndorsement) appStatusMap.set(app.id, XAppStatus.LOOKING_FOR_ENDORSEMENT)

    return { uniqueApps, appStatusMap }
  }, [xAppsData])

  const filteredApps = useMemo(() => {
    let apps = uniqueApps

    if (statusFilter !== "all") {
      apps = apps.filter(app => appStatusMap.get(app.id) === statusFilter)
    }

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase()
      apps = apps.filter(app => app.name.toLowerCase().includes(query))
    }

    return apps
  }, [uniqueApps, appStatusMap, statusFilter, debouncedSearch])

  const selectedApp = useMemo(() => {
    if (!selectedAppId || !xAppsData) return null
    return xAppsData.allApps.find(app => app.id === selectedAppId) ?? null
  }, [selectedAppId, xAppsData])

  const handleClose = useCallback(() => {
    setStep(1)
    setSelectedAppId(null)
    setSearchTerm("")
    setStatusFilter("all")
    onClose()
  }, [onClose])

  const handleNext = useCallback(() => {
    if (selectedAppId) setStep(2)
  }, [selectedAppId])

  const handleBack = useCallback(() => {
    setStep(1)
  }, [])

  const handleSuccess = useCallback(() => {
    setStep(1)
    setSelectedAppId(null)
    setSearchTerm("")
    setStatusFilter("all")
    onClose()
  }, [onClose])

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={handleClose}
      showCloseButton
      modalProps={{ unmountOnExit: false }}>
      {step === 1 || !selectedApp ? (
        <VStack gap={5} align="flex-start" w="full">
          <Heading size="xl" fontWeight="bold">
            {t("Endorse app")}
          </Heading>

          <HStack gap={3} w="full" align="stretch">
            <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" gap={2} align="start">
              <Text textStyle="md" color="text.subtle">
                {t("Node")}
              </Text>
              <HStack gap={2} align="center">
                <Image
                  src={node.metadata?.image}
                  alt={node.metadata?.name}
                  boxSize="24px"
                  rounded="sm"
                  objectFit="cover"
                />
                <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
                  {node.metadata?.name}
                </Text>
              </HStack>
            </VStack>
            <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" gap={2} align="start">
              <Text textStyle="md" color="text.subtle">
                {t("Available points")}
              </Text>
              <Text textStyle="md" fontWeight="bold">
                {node.availablePoints.toString()} {t("pts")}
              </Text>
            </VStack>
          </HStack>

          <HStack w="full" justify="space-between" align="center">
            <Text textStyle="lg" fontWeight="semibold">
              {t("Apps")}
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {filteredApps.length} {t("apps")}
            </Text>
          </HStack>

          <HStack gap={3} w="full">
            <Box flex={1} position="relative">
              <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1} pointerEvents="none">
                <Icon as={LuSearch} boxSize={4} color="text.subtle" />
              </Box>
              <Input
                placeholder={t("Search by app name")}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                pl={10}
                borderRadius="xl"
                size="md"
              />
            </Box>
            <NativeSelect.Root w="auto" minW="140px">
              <NativeSelect.Field
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as EndorseStatusFilter)}
                borderRadius="xl">
                <option value="all">{t("All statuses")}</option>
                <option value={XAppStatus.LOOKING_FOR_ENDORSEMENT}>{t("Looking for endorsement")}</option>
                <option value={XAppStatus.UNENDORSED_AND_ELIGIBLE}>{t("In grace period")}</option>
                <option value={XAppStatus.UNENDORSED_NOT_ELIGIBLE}>{t("Endorsement lost")}</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </HStack>

          <VStack w="full" gap={3} align="stretch" maxH="400px" overflowY="auto">
            {filteredApps.map(app => (
              <SelectableAppRow
                key={app.id}
                app={app}
                node={node}
                isSelected={selectedAppId === app.id}
                onSelect={() => setSelectedAppId(app.id)}
              />
            ))}
            {filteredApps.length === 0 && (
              <Text textStyle="sm" color="text.subtle" textAlign="center" py={6}>
                {t("No apps found")}
              </Text>
            )}
          </VStack>

          <HStack gap={4} justify="stretch" w="full" align="center" p={0}>
            <Button variant="secondary" flex={1} onClick={handleClose}>
              {t("Cancel")}
            </Button>
            <Button variant="primary" flex={1} onClick={handleNext} disabled={!selectedAppId}>
              {t("Next")}
            </Button>
          </HStack>
        </VStack>
      ) : (
        <EndorsementStep
          node={node}
          appId={selectedApp.id}
          appName={selectedApp.name}
          onBack={handleBack}
          onSuccess={handleSuccess}
        />
      )}
    </BaseModal>
  )
}

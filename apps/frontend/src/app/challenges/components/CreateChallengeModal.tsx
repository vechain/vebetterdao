"use client"

import "./typing-indicator.css"

import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  HStack,
  IconButton,
  Image,
  Input,
  Skeleton,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { parseEther } from "ethers"
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuPlus, LuX } from "react-icons/lu"

import { ChallengeKind, ChallengeVisibility, ThresholdMode } from "@/api/challenges/types"
import { CreateChallengeFormData, useChallengeActions } from "@/api/challenges/useChallengeActions"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { CustomModalContent } from "@/components/CustomModalContent"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"

interface CreateChallengeModalProps {
  defaultKind: number
  currentRound: number
  children: React.ReactNode
}

const MAX_SELECTED_APPS = 5
const QUICK_AMOUNTS = ["50", "100", "250"] as const
const QUICK_THRESHOLDS = ["1", "5", "10"] as const
const STEP_ORDER = [
  "kind",
  "amount",
  "startRound",
  "duration",
  "winner",
  "threshold",
  "appScope",
  "selectedApps",
  "visibility",
  "invitees",
  "review",
] as const

type ChallengeFlowStep = (typeof STEP_ORDER)[number]
type AppScope = "all" | "selected"

const initialForm = (kind: number, currentRound: number): CreateChallengeFormData => ({
  kind,
  visibility: ChallengeVisibility.Public,
  thresholdMode: ThresholdMode.None,
  stakeAmount: "",
  startRound: currentRound + 1,
  endRound: currentRound + 1,
  threshold: "0",
  appIds: [],
  invitees: [],
})

const AssistantBubble = ({ children }: { children: ReactNode }) => (
  <HStack align="start" gap="3" w="full">
    <Box
      boxSize="10"
      flexShrink={0}
      borderRadius="2xl"
      bg="bg.secondary"
      overflow="hidden"
      border="1px solid"
      borderColor="border.secondary">
      <Image src="/assets/images/B3MO_Rewards.png" alt="B3MO" boxSize="full" objectFit="contain" />
    </Box>
    <Box
      bg="bg.secondary"
      borderRadius="2xl"
      px={{ base: "4", md: "5" }}
      py={{ base: "3", md: "4" }}
      border="1px solid"
      borderColor="border.secondary"
      w="full">
      {children}
    </Box>
  </HStack>
)

const UserBubble = ({ children }: { children: ReactNode }) => (
  <HStack justify="end" w="full">
    <Box
      bg="bg.secondary"
      color="text.default"
      borderRadius="2xl"
      px={{ base: "4", md: "5" }}
      py="3"
      maxW={{ base: "full", md: "85%" }}>
      {children}
    </Box>
  </HStack>
)

const TypingIndicator = () => (
  <HStack align="start" gap="3" w="full">
    <Box
      boxSize="10"
      flexShrink={0}
      borderRadius="2xl"
      bg="bg.secondary"
      overflow="hidden"
      border="1px solid"
      borderColor="border.secondary">
      <Image src="/assets/images/B3MO_Rewards.png" alt="B3MO" boxSize="full" objectFit="contain" />
    </Box>
    <Box bg="bg.secondary" borderRadius="2xl" px="5" py="4" border="1px solid" borderColor="border.secondary">
      <HStack gap="1.5">
        {[0, 1, 2].map(i => (
          <Box
            key={i}
            boxSize="2"
            borderRadius="full"
            bg="text.subtle"
            style={{
              animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </HStack>
    </Box>
  </HStack>
)

const SummaryItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <VStack align="start" gap="1">
    <Text textStyle="xs" color="text.subtle">
      {label}
    </Text>
    <Text textStyle="sm" fontWeight="semibold">
      {value}
    </Text>
  </VStack>
)

const parseAmount = (value: string) => {
  if (!value) return 0n

  try {
    return parseEther(value)
  } catch {
    return 0n
  }
}

const normalizeInteger = (value: string) => {
  if (value === "") return "0"
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return "0"
  return String(Math.max(0, Math.trunc(parsed)))
}

const getCompactListLabel = (items: string[]) => {
  if (items.length === 0) return ""
  if (items.length <= 2) return items.join(", ")
  return `${items.slice(0, 2).join(", ")}, +${items.length - 2}`
}

const primaryVariant = "primary" as never
const _secondaryVariant = "secondary" as never
const tertiaryVariant = "tertiary" as never
const getChoiceVariant = (active: boolean) => (active ? primaryVariant : tertiaryVariant)

export const CreateChallengeModal = ({ defaultKind, currentRound, children }: CreateChallengeModalProps) => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateChallengeFormData>(initialForm(defaultKind, currentRound))
  const [kindChosen, setKindChosen] = useState(false)
  const [amountConfirmed, setAmountConfirmed] = useState(false)
  const [startRoundChosen, setStartRoundChosen] = useState(false)
  const [durationChosen, setDurationChosen] = useState(false)
  const [winnerChosen, setWinnerChosen] = useState(false)
  const [thresholdConfirmed, setThresholdConfirmed] = useState(false)
  const [appScope, setAppScope] = useState<AppScope | null>(null)
  const [appsConfirmed, setAppsConfirmed] = useState(false)
  const [visibilityChosen, setVisibilityChosen] = useState(false)
  const [inviteesConfirmed, setInviteesConfirmed] = useState(false)
  const [appSearch, setAppSearch] = useState("")
  const [showAppDropdown, setShowAppDropdown] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>()
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(
    () => () => {
      clearTimeout(dropdownTimeout.current)
      clearTimeout(typingTimeout.current)
    },
    [],
  )

  const withTyping = useCallback((fn: () => void) => {
    setIsTyping(true)
    const delay = 600 + Math.random() * 800
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false)
      fn()
    }, delay)
  }, [])
  const { account } = useWallet()
  const actions = useChallengeActions()
  const { t } = useTranslation()
  const { data: appsData } = useXApps({ filterBlacklisted: true })
  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useGetB3trBalance(account?.address ?? undefined)
  const hasReachedSelectedAppsLimit = form.appIds.length >= MAX_SELECTED_APPS

  const resetFlow = () => {
    setForm(initialForm(defaultKind, currentRound))
    setKindChosen(false)
    setAmountConfirmed(false)
    setStartRoundChosen(false)
    setDurationChosen(false)
    setWinnerChosen(false)
    setThresholdConfirmed(false)
    setAppScope(null)
    setAppsConfirmed(false)
    setVisibilityChosen(false)
    setInviteesConfirmed(false)
    setAppSearch("")
    setShowAppDropdown(false)
    setIsTyping(false)
    clearTimeout(typingTimeout.current)
  }

  const filteredApps = useMemo(() => {
    if (!appsData?.allApps || hasReachedSelectedAppsLimit || appScope !== "selected") return []
    const q = appSearch.toLowerCase()
    return appsData.allApps.filter(
      app => !form.appIds.includes(app.id) && (app.name.toLowerCase().includes(q) || app.id.toLowerCase().includes(q)),
    )
  }, [appScope, appsData, appSearch, form.appIds, hasReachedSelectedAppsLimit])
  const selectedAppNames = useMemo(
    () => form.appIds.map(appId => appsData?.allApps.find(app => app.id === appId)?.name ?? appId),
    [appsData?.allApps, form.appIds],
  )
  const stakeAmountWei = useMemo(() => {
    return parseAmount(form.stakeAmount)
  }, [form.stakeAmount])
  const hasInsufficientB3tr =
    !!account?.address &&
    !isB3trBalanceLoading &&
    stakeAmountWei > 0n &&
    stakeAmountWei > BigInt(b3trBalance?.original ?? "0")
  const thresholdValue = Number(form.threshold || "0")
  const hasInvalidThresholdConfiguration =
    form.kind === ChallengeKind.Sponsored &&
    ((thresholdValue > 0 && form.thresholdMode === ThresholdMode.None) ||
      (form.thresholdMode === ThresholdMode.SplitAboveThreshold && thresholdValue === 0))
  const minStartRound = currentRound + 1
  const hasInvalidStartRound = form.startRound <= currentRound
  const hasInvalidEndRound = form.endRound < form.startRound
  const duration = Math.max(1, form.endRound - form.startRound + 1)
  const isSponsored = form.kind === ChallengeKind.Sponsored
  const isPrivate = form.visibility === ChallengeVisibility.Private
  const isSplitPrize = form.thresholdMode === ThresholdMode.SplitAboveThreshold

  const update = <K extends keyof CreateChallengeFormData>(key: K, value: CreateChallengeFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const updateKind = (kind: number) => {
    setForm(prev => ({
      ...prev,
      kind,
      ...(kind === ChallengeKind.Stake
        ? {
            threshold: "0",
            thresholdMode: ThresholdMode.None,
          }
        : {}),
    }))
    withTyping(() => {
      setKindChosen(true)
      if (kind === ChallengeKind.Stake) {
        setWinnerChosen(false)
        setThresholdConfirmed(false)
      }
    })
  }

  const setWinnerMode = (splitPrize: boolean) => {
    setForm(prev => ({
      ...prev,
      thresholdMode: splitPrize ? ThresholdMode.SplitAboveThreshold : ThresholdMode.None,
      threshold: splitPrize ? (prev.threshold === "0" ? "1" : prev.threshold) : "0",
    }))
    withTyping(() => {
      setWinnerChosen(true)
      if (!splitPrize) setThresholdConfirmed(false)
    })
  }

  const updateThreshold = (value: string) => {
    update("threshold", normalizeInteger(value))
    setThresholdConfirmed(false)
  }

  const addApp = (appId: string) => {
    if (hasReachedSelectedAppsLimit || form.appIds.includes(appId)) return
    update("appIds", [...form.appIds, appId])
    setAppSearch("")
    setShowAppDropdown(false)
    setAppsConfirmed(false)
  }

  const removeApp = (appId: string) => {
    update(
      "appIds",
      form.appIds.filter(id => id !== appId),
    )
    setAppsConfirmed(false)
  }

  const updateInvitee = (index: number, value: string) => {
    const next = [...form.invitees]
    next[index] = value
    update("invitees", next)
    setInviteesConfirmed(false)
  }

  const addInvitee = () => {
    update("invitees", [...form.invitees, ""])
    setInviteesConfirmed(false)
  }

  const removeInvitee = (index: number) => {
    update(
      "invitees",
      form.invitees.filter((_, i) => i !== index),
    )
    setInviteesConfirmed(false)
  }

  const setStartRoundValue = (value: number) => {
    const startRound = Math.max(minStartRound, value || minStartRound)
    setForm(prev => {
      const currentDuration = Math.max(1, Math.min(4, prev.endRound - prev.startRound + 1))
      return {
        ...prev,
        startRound,
        endRound: startRound + currentDuration - 1,
      }
    })
  }

  const chooseStartRound = (value: number) => {
    setStartRoundValue(value)
    withTyping(() => setStartRoundChosen(true))
  }

  const chooseDuration = (value: number) => {
    update("endRound", form.startRound + value - 1)
    withTyping(() => setDurationChosen(true))
  }

  const chooseAppScope = (value: AppScope) => {
    if (value === "all") {
      update("appIds", [])
      setAppsConfirmed(false)
      withTyping(() => setAppScope(value))
    } else {
      setAppScope(value)
    }
  }

  const chooseVisibility = (value: ChallengeVisibility) => {
    update("visibility", value)
    withTyping(() => {
      setVisibilityChosen(true)
      if (value === ChallengeVisibility.Public) {
        update("invitees", [])
        setInviteesConfirmed(false)
      }
    })
  }

  const confirmAmount = () => {
    if (stakeAmountWei === 0n || hasInsufficientB3tr) return
    withTyping(() => setAmountConfirmed(true))
  }

  const confirmStartRound = () => {
    if (hasInvalidStartRound) return
    withTyping(() => setStartRoundChosen(true))
  }

  const confirmThreshold = () => {
    if (thresholdValue === 0) return
    withTyping(() => setThresholdConfirmed(true))
  }

  const confirmSelectedApps = () => {
    if (form.appIds.length === 0) return
    withTyping(() => setAppsConfirmed(true))
  }

  const confirmInvitees = (skip = false) => {
    update("invitees", skip ? [] : form.invitees.map(value => value.trim()).filter(Boolean))
    withTyping(() => setInviteesConfirmed(true))
  }

  const canUseAmount = (value: string) => {
    const parsedAmount = parseAmount(value)
    if (parsedAmount === 0n) return false
    if (!account?.address || isB3trBalanceLoading) return true
    return parsedAmount <= BigInt(b3trBalance?.original ?? "0")
  }

  const resetFrom = (stepKey: Exclude<ChallengeFlowStep, "review">) => {
    const index = STEP_ORDER.indexOf(stepKey)
    if (index <= STEP_ORDER.indexOf("kind")) setKindChosen(false)
    if (index <= STEP_ORDER.indexOf("amount")) setAmountConfirmed(false)
    if (index <= STEP_ORDER.indexOf("startRound")) setStartRoundChosen(false)
    if (index <= STEP_ORDER.indexOf("duration")) setDurationChosen(false)
    if (index <= STEP_ORDER.indexOf("winner")) setWinnerChosen(false)
    if (index <= STEP_ORDER.indexOf("threshold")) setThresholdConfirmed(false)
    if (index <= STEP_ORDER.indexOf("appScope")) {
      setAppScope(null)
      setAppsConfirmed(false)
    }
    if (index <= STEP_ORDER.indexOf("selectedApps")) setAppsConfirmed(false)
    if (index <= STEP_ORDER.indexOf("visibility")) {
      setVisibilityChosen(false)
      setInviteesConfirmed(false)
    }
    if (index <= STEP_ORDER.indexOf("invitees")) setInviteesConfirmed(false)
  }

  const handleOpen = (e: { open: boolean }) => {
    if (e.open) {
      resetFlow()
    }
    setOpen(e.open)
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    const parsed: CreateChallengeFormData = {
      ...form,
      invitees: form.invitees.map(s => s.trim()).filter(Boolean),
    }
    actions.createChallenge(parsed)
    setOpen(false)
  }

  const canSubmit =
    !!account?.address &&
    !isB3trBalanceLoading &&
    stakeAmountWei > 0n &&
    !hasInvalidStartRound &&
    !hasInvalidEndRound &&
    !hasInsufficientB3tr &&
    !hasInvalidThresholdConfiguration
  const titleKey = isSponsored ? "Create sponsored challenge" : "Create challenge"
  const amountLabelKey = isSponsored ? "Prize amount (B3TR)" : "Bet amount (B3TR)"
  const currentQuickStartRounds = [minStartRound, minStartRound + 1, minStartRound + 2]
  const inviteesPreview = form.invitees.length === 0 ? t("Skip") : getCompactListLabel(form.invitees)
  const selectedAppsPreview = appScope === "all" ? t("All apps") : getCompactListLabel(selectedAppNames)

  const steps = [
    {
      key: "kind" as const,
      isRelevant: true,
      isComplete: kindChosen,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("Choose challenge type")}
        </Text>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t(form.kind === ChallengeKind.Stake ? "Bet" : "Sponsored")}
        </Text>
      ),
      controls: (
        <VStack gap="2" ml="auto">
          <Box
            as="button"
            w="full"
            textAlign="left"
            bg="bg.secondary"
            color="text.default"
            borderRadius="2xl"
            px={{ base: "4", md: "5" }}
            py="3"
            border="1px solid"
            borderColor="border.secondary"
            _hover={{ borderColor: "border.active" }}
            onClick={() => updateKind(ChallengeKind.Stake)}>
            <Text textStyle="sm" fontWeight="semibold">
              {t("Bet")}
            </Text>
            <Text textStyle="xs" mt="1" opacity={0.85}>
              {t("Challenge type description")}
            </Text>
          </Box>
          <Box
            as="button"
            w="full"
            textAlign="left"
            bg="bg.secondary"
            color="text.default"
            borderRadius="2xl"
            px={{ base: "4", md: "5" }}
            py="3"
            border="1px solid"
            borderColor="border.secondary"
            _hover={{ borderColor: "border.active" }}
            onClick={() => updateKind(ChallengeKind.Sponsored)}>
            <Text textStyle="sm" fontWeight="semibold">
              {t("Sponsored")}
            </Text>
            <Text textStyle="xs" mt="1" opacity={0.85}>
              {t("Sponsored challenge type description")}
            </Text>
          </Box>
        </VStack>
      ),
    },
    {
      key: "amount" as const,
      isRelevant: true,
      isComplete: amountConfirmed,
      prompt: (
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" fontWeight="semibold">
            {t(amountLabelKey)}
          </Text>
          <Text textStyle="xs" color="text.subtle">
            {t("Your B3TR balance")}
            {":"}{" "}
            <Skeleton as="span" loading={isB3trBalanceLoading}>
              {b3trBalance?.formatted ?? "0"}
            </Skeleton>
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {form.stakeAmount} {"B3TR"}
        </Text>
      ),
      controls: (
        <VStack align="stretch" gap="3" ml="auto">
          <HStack gap="2" flexWrap="wrap">
            {QUICK_AMOUNTS.map(value => (
              <Button
                key={value}
                size="sm"
                variant={getChoiceVariant(form.stakeAmount === value)}
                onClick={() => {
                  update("stakeAmount", value)
                  if (canUseAmount(value)) withTyping(() => setAmountConfirmed(true))
                }}>
                {value} {"B3TR"}
              </Button>
            ))}
          </HStack>
          <Field.Root invalid={hasInsufficientB3tr}>
            <Field.Label>{t(amountLabelKey)}</Field.Label>
            <Input
              type="number"
              placeholder="100"
              value={form.stakeAmount}
              onChange={e => {
                update("stakeAmount", e.target.value)
                setAmountConfirmed(false)
              }}
            />
            {hasInsufficientB3tr && <Field.ErrorText>{t("Insufficient balance")}</Field.ErrorText>}
          </Field.Root>
          <HStack justify="flex-end">
            <Button
              size="sm"
              variant={primaryVariant}
              disabled={stakeAmountWei === 0n || hasInsufficientB3tr}
              onClick={confirmAmount}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "startRound" as const,
      isRelevant: true,
      isComplete: startRoundChosen,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("Start round")}
        </Text>
      ),
      answer: (
        <Text textStyle="sm">
          {t("Start round")}
          {": "}
          {form.startRound}
        </Text>
      ),
      controls: (
        <VStack align="stretch" gap="3" ml="auto">
          <HStack gap="2" flexWrap="wrap">
            {currentQuickStartRounds.map(value => (
              <Button
                key={value}
                size="sm"
                variant={getChoiceVariant(form.startRound === value)}
                onClick={() => chooseStartRound(value)}>
                {value === minStartRound ? t("Next round") : `+${value - currentRound}`}
              </Button>
            ))}
          </HStack>
          <Field.Root invalid={hasInvalidStartRound}>
            <Field.Label>{t("Start round")}</Field.Label>
            <Input
              type="number"
              min={minStartRound}
              value={form.startRound}
              onChange={e => {
                setStartRoundValue(Number(e.target.value))
                setStartRoundChosen(false)
              }}
            />
          </Field.Root>
          <HStack justify="flex-end">
            <Button size="sm" variant={primaryVariant} disabled={hasInvalidStartRound} onClick={confirmStartRound}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "duration" as const,
      isRelevant: true,
      isComplete: durationChosen,
      prompt: (
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" fontWeight="semibold">
            {t("How long should it run?")}
          </Text>
          <Text textStyle="xs" color="text.subtle">
            {t("Duration: {{count}} rounds", { count: duration })}
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t("Duration: {{count}} rounds", { count: duration })}
        </Text>
      ),
      controls: (
        <HStack gap="2" flexWrap="wrap" ml="auto">
          {[1, 2, 3, 4].map(value => (
            <Button
              key={value}
              size="sm"
              variant={getChoiceVariant(duration === value)}
              onClick={() => chooseDuration(value)}>
              {value}
            </Button>
          ))}
        </HStack>
      ),
    },
    {
      key: "winner" as const,
      isRelevant: isSponsored,
      isComplete: winnerChosen,
      prompt: (
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" fontWeight="semibold">
            {t("Winner")}
          </Text>
          <Text textStyle="xs" color="text.subtle">
            {t(isSplitPrize ? "Split prize description" : "Max actions description")}
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t(isSplitPrize ? "Split prize" : "Max actions")}
        </Text>
      ),
      controls: (
        <HStack gap="2" flexWrap="wrap" ml="auto">
          <Button size="sm" variant={getChoiceVariant(!isSplitPrize)} onClick={() => setWinnerMode(false)}>
            {t("Max actions")}
          </Button>
          <Button size="sm" variant={getChoiceVariant(isSplitPrize)} onClick={() => setWinnerMode(true)}>
            {t("Split prize")}
          </Button>
        </HStack>
      ),
    },
    {
      key: "threshold" as const,
      isRelevant: isSponsored && isSplitPrize,
      isComplete: thresholdConfirmed && thresholdValue > 0,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("Minimum actions")}
        </Text>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {form.threshold}
        </Text>
      ),
      controls: (
        <VStack align="stretch" gap="3" ml="auto">
          <HStack gap="2" flexWrap="wrap">
            {QUICK_THRESHOLDS.map(value => (
              <Button
                key={value}
                size="sm"
                variant={getChoiceVariant(form.threshold === value)}
                onClick={() => {
                  update("threshold", value)
                  withTyping(() => setThresholdConfirmed(true))
                }}>
                {value}
              </Button>
            ))}
          </HStack>
          <Field.Root invalid={thresholdValue === 0}>
            <Field.Label>{t("Minimum actions")}</Field.Label>
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="1"
              value={form.threshold}
              onChange={e => updateThreshold(e.target.value)}
            />
            {thresholdValue === 0 && <Field.ErrorText>{t("Minimum actions must be greater than 0")}</Field.ErrorText>}
          </Field.Root>
          <HStack justify="flex-end">
            <Button size="sm" variant={primaryVariant} disabled={thresholdValue === 0} onClick={confirmThreshold}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "appScope" as const,
      isRelevant: true,
      isComplete: appScope !== null,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("Which apps should count?")}
        </Text>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {appScope === "selected" ? t("Selected apps") : t("All apps")}
        </Text>
      ),
      controls: (
        <HStack gap="2" flexWrap="wrap" ml="auto">
          <Button
            size="sm"
            variant={getChoiceVariant((appScope ?? "all") === "all")}
            onClick={() => chooseAppScope("all")}>
            {t("All apps")}
          </Button>
          <Button
            size="sm"
            variant={getChoiceVariant(appScope === "selected")}
            onClick={() => chooseAppScope("selected")}>
            {t("Selected apps")}
          </Button>
        </HStack>
      ),
    },
    {
      key: "selectedApps" as const,
      isRelevant: appScope === "selected",
      isComplete: appsConfirmed,
      prompt: (
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" fontWeight="semibold">
            {t("Select up to {{count}} apps", { count: MAX_SELECTED_APPS })}
          </Text>
          <Text textStyle="xs" color="text.subtle">
            {form.appIds.length}
            {"/"}
            {MAX_SELECTED_APPS}
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {selectedAppsPreview}
        </Text>
      ),
      controls: (
        <VStack align="stretch" gap="3" ml="auto">
          <Field.Root>
            <Field.Label>{t("Apps (leave empty for all)")}</Field.Label>
            <Box position="relative">
              <Input
                placeholder={t("Search apps...")}
                value={appSearch}
                disabled={hasReachedSelectedAppsLimit}
                onChange={e => {
                  setAppSearch(e.target.value)
                  setShowAppDropdown(true)
                  setAppsConfirmed(false)
                }}
                onFocus={() => setShowAppDropdown(true)}
                onBlur={() => {
                  dropdownTimeout.current = setTimeout(() => setShowAppDropdown(false), 150)
                }}
              />
              {showAppDropdown && filteredApps.length > 0 && (
                <Box
                  position="absolute"
                  top="100%"
                  left="0"
                  right="0"
                  zIndex="dropdown"
                  bg="bg"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="md"
                  maxH="200px"
                  overflowY="auto"
                  mt="1">
                  {filteredApps.map(app => (
                    <Box
                      key={app.id}
                      px="3"
                      py="2"
                      cursor="pointer"
                      _hover={{ bg: "bg.muted" }}
                      onMouseDown={() => {
                        clearTimeout(dropdownTimeout.current)
                        addApp(app.id)
                      }}>
                      <Text textStyle="sm">{app.name}</Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Field.Root>
          {form.appIds.length > 0 && (
            <VStack align="stretch" gap="1" w="full">
              {form.appIds.map(appId => {
                const app = appsData?.allApps.find(candidate => candidate.id === appId)
                return (
                  <HStack key={appId} justify="space-between" px="2" py="1" borderRadius="md" bg="bg.muted">
                    <Text textStyle="sm" truncate>
                      {app?.name ?? appId}
                    </Text>
                    <IconButton size="2xs" variant="ghost" onClick={() => removeApp(appId)} aria-label="Remove">
                      <LuX />
                    </IconButton>
                  </HStack>
                )
              })}
            </VStack>
          )}
          <HStack justify="flex-end">
            <Button
              size="sm"
              variant={primaryVariant}
              disabled={form.appIds.length === 0}
              onClick={confirmSelectedApps}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "visibility" as const,
      isRelevant: true,
      isComplete: visibilityChosen,
      prompt: (
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" fontWeight="semibold">
            {t("Who can join?")}
          </Text>
          <Text textStyle="xs" color="text.subtle">
            {t(
              form.visibility === ChallengeVisibility.Public
                ? "Public challenge visibility description"
                : "Private challenge visibility description",
            )}
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t(form.visibility === ChallengeVisibility.Public ? "Public" : "Private")}
        </Text>
      ),
      controls: (
        <HStack gap="2" flexWrap="wrap" ml="auto">
          <Button
            size="sm"
            variant={getChoiceVariant(form.visibility === ChallengeVisibility.Public)}
            onClick={() => chooseVisibility(ChallengeVisibility.Public)}>
            {t("Public")}
          </Button>
          <Button
            size="sm"
            variant={getChoiceVariant(form.visibility === ChallengeVisibility.Private)}
            onClick={() => chooseVisibility(ChallengeVisibility.Private)}>
            {t("Private")}
          </Button>
        </HStack>
      ),
    },
    {
      key: "invitees" as const,
      isRelevant: isPrivate,
      isComplete: inviteesConfirmed,
      prompt: (
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" fontWeight="semibold">
            {t("Invitees")}
          </Text>
          <Text textStyle="xs" color="text.subtle">
            {t("Add invitees now or skip this step.")}
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {inviteesPreview}
        </Text>
      ),
      controls: (
        <VStack align="stretch" gap="3" ml="auto">
          {form.invitees.length > 0 && (
            <VStack align="stretch" gap="2" w="full">
              {form.invitees.map((addr, index) => (
                <HStack key={index} gap="2">
                  <Input placeholder="0x..." value={addr} onChange={e => updateInvitee(index, e.target.value)} />
                  <IconButton size="sm" variant="ghost" onClick={() => removeInvitee(index)} aria-label="Remove">
                    <LuX />
                  </IconButton>
                </HStack>
              ))}
            </VStack>
          )}
          <Button size="sm" variant={tertiaryVariant} alignSelf="start" onClick={addInvitee}>
            <LuPlus />
            {t("Add invitee")}
          </Button>
          <HStack justify="flex-end" flexWrap="wrap">
            <Button size="sm" variant={tertiaryVariant} onClick={() => confirmInvitees(true)}>
              {t("Skip")}
            </Button>
            <Button size="sm" variant={primaryVariant} onClick={() => confirmInvitees(false)}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "review" as const,
      isRelevant: true,
      isComplete: false,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("Review your challenge")}
        </Text>
      ),
      controls: (
        <Box ml="auto">
          <Box bg="bg.secondary" borderRadius="2xl" px={{ base: "4", md: "5" }} py={{ base: "4", md: "5" }}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              <SummaryItem
                label={t("Choose challenge type")}
                value={t(form.kind === ChallengeKind.Stake ? "Bet" : "Sponsored")}
              />
              <SummaryItem label={t(amountLabelKey)} value={`${form.stakeAmount} B3TR`} />
              <SummaryItem label={t("Start round")} value={form.startRound} />
              <SummaryItem label={t("End round")} value={form.endRound} />
              {isSponsored && (
                <SummaryItem label={t("Winner")} value={t(isSplitPrize ? "Split prize" : "Max actions")} />
              )}
              {isSponsored && isSplitPrize && <SummaryItem label={t("Minimum actions")} value={form.threshold} />}
              <SummaryItem
                label={t("Apps (leave empty for all)")}
                value={appScope === "selected" ? selectedAppNames.join(", ") : t("All apps")}
              />
              <SummaryItem
                label={t("Who can join?")}
                value={t(form.visibility === ChallengeVisibility.Public ? "Public" : "Private")}
              />
              {isPrivate && (
                <SummaryItem
                  label={t("Invitees")}
                  value={form.invitees.length > 0 ? form.invitees.join(", ") : t("Skip")}
                />
              )}
            </SimpleGrid>
          </Box>
        </Box>
      ),
    },
  ]

  const currentStep = (steps.find(step => step.isRelevant && !step.isComplete) ?? steps[steps.length - 1])!
  const currentStepIndex = steps.findIndex(step => step.key === currentStep.key)
  const visibleSteps = steps.filter((step, index) => step.isRelevant && index <= currentStepIndex)
  const previousStep = [...steps.slice(0, currentStepIndex)].reverse().find(step => step.isRelevant)

  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 60)
    return () => clearTimeout(timeout)
  }, [currentStep.key, open])

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <CustomModalContent maxW={{ base: "100%", md: "2xl" }} maxH="90vh">
        <Dialog.Header pb="5">
          <HStack gap="3" align="center">
            <Box boxSize="14" borderRadius="3xl" bg="bg.secondary" overflow="hidden" p="1.5">
              <Image src="/assets/images/B3MO_Rewards.png" alt="B3MO" boxSize="full" objectFit="contain" />
            </Box>
            <VStack align="start" gap="0">
              <Dialog.Title>{t(titleKey)}</Dialog.Title>
              <Text textStyle="xs" color="text.subtle">
                {"B3MO"}
              </Text>
            </VStack>
          </HStack>
        </Dialog.Header>

        <Dialog.Body overflowY="auto" pb="2">
          <VStack align="stretch" gap="4">
            <AssistantBubble>
              <Text textStyle="sm">{t("Hi, I'm B3MO. I'll guide you through your challenge setup.")}</Text>
            </AssistantBubble>

            {visibleSteps.map(step => {
              const isCurrent = step.key === currentStep.key

              return (
                <VStack key={step.key} align="stretch" gap="3">
                  <AssistantBubble>{step.prompt}</AssistantBubble>
                  {step.answer && !isCurrent && <UserBubble>{step.answer}</UserBubble>}
                  {isCurrent && !isTyping && step.controls}
                </VStack>
              )
            })}

            {isTyping && <TypingIndicator />}

            <Box ref={messagesEndRef} />
          </VStack>
        </Dialog.Body>

        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button variant="outline">{t("Cancel")}</Button>
          </Dialog.ActionTrigger>
          {!!previousStep && previousStep.key !== "review" && (
            <Button variant={tertiaryVariant} onClick={() => resetFrom(previousStep.key)}>
              {t("Back")}
            </Button>
          )}
          {currentStep.key === "review" && (
            <Button variant={primaryVariant} disabled={!canSubmit} onClick={handleSubmit}>
              {t("Create")}
            </Button>
          )}
        </Dialog.Footer>

        <Dialog.CloseTrigger asChild>
          <CloseButton size="sm" />
        </Dialog.CloseTrigger>
      </CustomModalContent>
    </Dialog.Root>
  )
}

import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ChallengeKind, ChallengeVisibility, ThresholdMode } from "@/api/challenges/types"
import { CreateChallengeFormData, useChallengeActions } from "@/api/challenges/useChallengeActions"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"

import {
  AppScope,
  initialForm,
  MAX_SELECTED_APPS,
  normalizeInteger,
  parseAmount,
  STEP_ORDER,
  type ChallengeFlowStep,
} from "./types"

export const useCreateChallengeFlow = (defaultKind: number, currentRound: number) => {
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

  const stakeAmountWei = useMemo(() => parseAmount(form.stakeAmount), [form.stakeAmount])

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
      ...(kind === ChallengeKind.Stake ? { threshold: "0", thresholdMode: ThresholdMode.None } : {}),
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
      return { ...prev, startRound, endRound: startRound + currentDuration - 1 }
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
    if (e.open) resetFlow()
    setOpen(e.open)
  }

  const canSubmit =
    !!account?.address &&
    !isB3trBalanceLoading &&
    stakeAmountWei > 0n &&
    !hasInvalidStartRound &&
    !hasInvalidEndRound &&
    !hasInsufficientB3tr &&
    !hasInvalidThresholdConfiguration

  const handleSubmit = () => {
    if (!canSubmit) return
    const parsed: CreateChallengeFormData = {
      ...form,
      invitees: form.invitees.map(s => s.trim()).filter(Boolean),
    }
    actions.createChallenge(parsed)
    setOpen(false)
  }

  return {
    open,
    form,
    isTyping,
    appScope,
    appSearch,
    showAppDropdown,
    messagesEndRef,
    dropdownTimeout,

    // derived
    stakeAmountWei,
    hasInsufficientB3tr,
    thresholdValue,
    minStartRound,
    hasInvalidStartRound,
    duration,
    isSponsored,
    isPrivate,
    isSplitPrize,
    hasReachedSelectedAppsLimit,
    canSubmit,
    filteredApps,
    selectedAppNames,
    b3trBalance,
    isB3trBalanceLoading,
    appsData,

    // step flags
    kindChosen,
    amountConfirmed,
    startRoundChosen,
    durationChosen,
    winnerChosen,
    thresholdConfirmed,
    appsConfirmed,
    visibilityChosen,
    inviteesConfirmed,

    // actions
    handleOpen,
    handleSubmit,
    resetFrom,
    updateKind,
    confirmAmount,
    chooseStartRound,
    confirmStartRound,
    chooseDuration,
    setWinnerMode,
    updateThreshold,
    confirmThreshold,
    chooseAppScope,
    confirmSelectedApps,
    chooseVisibility,
    confirmInvitees,
    addApp,
    removeApp,
    addInvitee,
    removeInvitee,
    updateInvitee,
    update,
    withTyping,
    canUseAmount,
    setAppSearch,
    setShowAppDropdown,
    setAppsConfirmed,
    setAmountConfirmed,
    setStartRoundChosen,
    setStartRoundValue,
  }
}

export type CreateChallengeFlow = ReturnType<typeof useCreateChallengeFlow>

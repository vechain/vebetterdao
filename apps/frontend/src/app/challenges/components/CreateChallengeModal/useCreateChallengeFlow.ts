import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { decodeEventLog, toEventSelector } from "viem"

import {
  ChallengeKind,
  ChallengeType,
  ChallengeVisibility,
  getChallengeMetadataLengthError,
} from "@/api/challenges/types"
import { CreateChallengeFormData, useChallengeActions } from "@/api/challenges/useChallengeActions"
import { defaultMinBetAmount, useMinBetAmount } from "@/api/challenges/useMinBetAmount"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"
import { useGetAddressFromVetDomains } from "@/hooks/useGetVetDomains"

import {
  countResolvedInvitees,
  getInviteeValidationError,
  getSanitizedInvitees,
  isVetDomain,
  parseInviteeValues,
} from "../../shared/inviteeValidation"

import {
  AppScope,
  initialForm,
  MAX_SELECTED_APPS,
  normalizeInteger,
  parseAmount,
  STEP_ORDER,
  type ChallengeFlowStep,
} from "./types"

const challengesAbi = B3TRChallenges__factory.abi
const challengeCreatedSelector = toEventSelector(
  "ChallengeCreated(uint256,address,uint256,uint8,uint8,uint8,uint256,uint256,uint256,bool,bytes32[],string,string,string,string)",
)

export const useCreateChallengeFlow = (defaultKind: number, currentRound: number) => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateChallengeFormData>(initialForm(defaultKind, currentRound))
  const [kindChosen, setKindChosen] = useState(false)
  const [visibilityChosen, setVisibilityChosen] = useState(false)
  const [challengeTypeChosen, setChallengeTypeChosen] = useState(false)
  const [typeExplainerSeen, setTypeExplainerSeen] = useState(false)
  const [splitWinNumWinnersConfirmed, setSplitWinNumWinnersConfirmed] = useState(false)
  const [splitWinThresholdConfirmed, setSplitWinThresholdConfirmed] = useState(false)
  const [titleConfirmed, setTitleConfirmed] = useState(false)
  const [amountConfirmed, setAmountConfirmed] = useState(false)
  const [startRoundChosen, setStartRoundChosen] = useState(false)
  const [durationChosen, setDurationChosen] = useState(false)
  const [appScope, setAppScope] = useState<AppScope | null>(null)
  const [appsConfirmed, setAppsConfirmed] = useState(false)
  const [inviteesConfirmed, setInviteesConfirmed] = useState(false)
  const [appSearch, setAppSearch] = useState("")
  const [appResultsPage, setAppResultsPage] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  const typingTimeout = useRef<ReturnType<typeof setTimeout>>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingCreateRef = useRef(false)
  const router = useRouter()

  useEffect(
    () => () => {
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

  useEffect(() => {
    if (!pendingCreateRef.current || actions.status !== "success" || !actions.txReceipt) return
    for (const output of (actions.txReceipt as any).outputs ?? []) {
      for (const ev of output.events ?? []) {
        if (ev.topics?.[0]?.toLowerCase() !== challengeCreatedSelector.toLowerCase()) continue
        const decoded = decodeEventLog({
          abi: challengesAbi,
          data: ev.data as `0x${string}`,
          topics: ev.topics as [`0x${string}`, ...`0x${string}`[]],
          eventName: "ChallengeCreated",
        })
        const id = (decoded.args as { challengeId: bigint }).challengeId
        pendingCreateRef.current = false
        router.push(`/challenges/${id.toString()}?fresh=1`)
        return
      }
    }
  }, [actions.status, actions.txReceipt, router])

  const { data: appsData, isLoading: isAppsLoading } = useXApps({ filterBlacklisted: true })
  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useGetB3trBalance(account?.address ?? undefined)
  const { data: minBetAmountResult } = useMinBetAmount()
  const hasReachedSelectedAppsLimit = form.appIds.length >= MAX_SELECTED_APPS

  const resetFlow = () => {
    setForm(initialForm(defaultKind, currentRound))
    setKindChosen(false)
    setVisibilityChosen(false)
    setChallengeTypeChosen(false)
    setTypeExplainerSeen(false)
    setSplitWinNumWinnersConfirmed(false)
    setSplitWinThresholdConfirmed(false)
    setTitleConfirmed(false)
    setAmountConfirmed(false)
    setStartRoundChosen(false)
    setDurationChosen(false)
    setAppScope(null)
    setAppsConfirmed(false)
    setInviteesConfirmed(false)
    setAppSearch("")
    setAppResultsPage(0)
    setIsTyping(false)
    clearTimeout(typingTimeout.current)
  }

  const filteredApps = useMemo(() => {
    if (!appsData?.allApps || appScope !== "selected") return []
    const q = appSearch.toLowerCase()
    return appsData.allApps.filter(
      app => !form.appIds.includes(app.id) && (app.name.toLowerCase().includes(q) || app.id.toLowerCase().includes(q)),
    )
  }, [appScope, appsData, appSearch, form.appIds])

  const selectedAppNames = useMemo(
    () => form.appIds.map(appId => appsData?.allApps.find(app => app.id === appId)?.name ?? appId),
    [appsData?.allApps, form.appIds],
  )

  const stakeAmountWei = useMemo(() => parseAmount(form.stakeAmount), [form.stakeAmount])
  const minBetAmountData = minBetAmountResult?.[0]
  const minBetAmountWei =
    typeof minBetAmountData === "bigint" && minBetAmountData > 0n ? minBetAmountData : defaultMinBetAmount

  const hasInsufficientB3tr =
    !!account?.address &&
    !isB3trBalanceLoading &&
    stakeAmountWei > 0n &&
    stakeAmountWei > BigInt(b3trBalance?.original ?? "0")

  const thresholdValue = Number(form.threshold || "0")
  const numWinnersValue = Number(form.numWinners || "0")

  const minStartRound = currentRound + 1
  const hasInvalidStartRound = form.startRound <= currentRound
  const hasInvalidEndRound = form.endRound < form.startRound
  const duration = Math.max(1, form.endRound - form.startRound + 1)
  const isSponsored = form.kind === ChallengeKind.Sponsored
  const hasBelowMinimumBetAmount = stakeAmountWei > 0n && stakeAmountWei < minBetAmountWei
  const isPrivate = form.visibility === ChallengeVisibility.Private
  const isSplitWin = form.challengeType === ChallengeType.SplitWin

  // The matrix forces the visibility step away on Bet (always Private) and the type step away on Bet (always
  // MaxActions) and on Sponsored Public (always SplitWin). We keep separate "needsXxx" flags so the steps render
  // only when the user actually has a choice to make.
  const needsVisibilityChoice = isSponsored
  const needsChallengeTypeChoice = isSponsored && form.visibility === ChallengeVisibility.Private

  const splitWinPrizePerWinner = useMemo(() => {
    if (!isSplitWin || numWinnersValue <= 0 || stakeAmountWei <= 0n) return 0n
    return stakeAmountWei / BigInt(numWinnersValue)
  }, [isSplitWin, numWinnersValue, stakeAmountWei])

  const hasInvalidSplitWinConfiguration =
    isSplitWin &&
    (numWinnersValue <= 0 || thresholdValue <= 0 || (stakeAmountWei > 0n && stakeAmountWei < BigInt(numWinnersValue)))

  const metadataLengthError = useMemo(
    () =>
      getChallengeMetadataLengthError({
        title: form.title.trim(),
        description: form.description.trim(),
        imageURI: form.imageURI.trim(),
        metadataURI: form.metadataURI.trim(),
      }),
    [form.description, form.imageURI, form.metadataURI, form.title],
  )
  const hasTitleTooLong = metadataLengthError?.field === "title"
  const hasMetadataLengthError = metadataLengthError !== null
  const domainInvitees = useMemo(() => form.invitees.map(value => value.trim()).filter(isVetDomain), [form.invitees])
  const {
    data: resolvedDomainAddresses = [],
    isPending: isInviteesPending,
    isFetching: isInviteesFetching,
  } = useGetAddressFromVetDomains(domainInvitees.length > 0 ? domainInvitees : undefined)
  const parsedInvitees = useMemo(
    () => parseInviteeValues(form.invitees, resolvedDomainAddresses),
    [form.invitees, resolvedDomainAddresses],
  )
  const resolvedInviteeCounts = useMemo(() => countResolvedInvitees(parsedInvitees), [parsedInvitees])
  const sanitizedInvitees = useMemo(() => getSanitizedInvitees(parsedInvitees), [parsedInvitees])
  const isResolvingInvitees = domainInvitees.length > 0 && (isInviteesPending || isInviteesFetching)
  const inviteeErrorKeys = useMemo(
    () =>
      parsedInvitees.map(invitee =>
        getInviteeValidationError({
          invitee,
          creatorAddress: account?.address,
          resolvedInviteeCounts,
          isResolvingDomains: isResolvingInvitees,
        }),
      ),
    [account?.address, isResolvingInvitees, parsedInvitees, resolvedInviteeCounts],
  )
  const hasInviteeErrors = inviteeErrorKeys.some(error => error !== null)
  const canConfirmInvitees = !isResolvingInvitees && !hasInviteeErrors

  const update = <K extends keyof CreateChallengeFormData>(key: K, value: CreateChallengeFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const updateKind = (kind: number) => {
    setForm(prev => ({
      ...prev,
      kind,
      // Bet is locked to Private + MaxActions per the matrix.
      ...(kind === ChallengeKind.Stake
        ? {
            visibility: ChallengeVisibility.Private,
            challengeType: ChallengeType.MaxActions,
            threshold: "0",
            numWinners: "0",
          }
        : {
            // Sponsored defaults to Public + SplitWin (the only Sponsored Public option).
            visibility: ChallengeVisibility.Public,
            challengeType: ChallengeType.SplitWin,
          }),
    }))
    withTyping(() => {
      setKindChosen(true)
      setVisibilityChosen(false)
      setChallengeTypeChosen(false)
      setTypeExplainerSeen(false)
      setSplitWinNumWinnersConfirmed(false)
      setSplitWinThresholdConfirmed(false)
    })
  }

  const chooseVisibility = (value: ChallengeVisibility) => {
    setForm(prev => ({
      ...prev,
      visibility: value,
      // Sponsored Public must be SplitWin; Private resets to MaxActions and clears any previous splitwin choice.
      ...(value === ChallengeVisibility.Public
        ? { challengeType: ChallengeType.SplitWin }
        : { challengeType: ChallengeType.MaxActions, threshold: "0", numWinners: "0" }),
      ...(value === ChallengeVisibility.Public ? { invitees: [] } : {}),
    }))
    withTyping(() => {
      setVisibilityChosen(true)
      setChallengeTypeChosen(false)
      setTypeExplainerSeen(false)
      setSplitWinNumWinnersConfirmed(false)
      setSplitWinThresholdConfirmed(false)
      if (value === ChallengeVisibility.Public) setInviteesConfirmed(false)
    })
  }

  const setChallengeTypeChoice = (challengeType: number) => {
    setForm(prev => ({
      ...prev,
      challengeType,
      // Switching to MaxActions clears SplitWin-only fields; SplitWin defaults the threshold to 1.
      ...(challengeType === ChallengeType.MaxActions
        ? { threshold: "0", numWinners: "0" }
        : {
            threshold: prev.threshold === "0" ? "1" : prev.threshold,
            numWinners: prev.numWinners === "0" ? "1" : prev.numWinners,
          }),
    }))
    withTyping(() => {
      setChallengeTypeChosen(true)
      setTypeExplainerSeen(false)
      setSplitWinNumWinnersConfirmed(false)
      setSplitWinThresholdConfirmed(false)
    })
  }

  const acknowledgeTypeExplainer = () => {
    withTyping(() => setTypeExplainerSeen(true))
  }

  const updateThreshold = (value: string) => {
    update("threshold", normalizeInteger(value))
    setSplitWinThresholdConfirmed(false)
  }

  const updateNumWinners = (value: string) => {
    update("numWinners", normalizeInteger(value))
    setSplitWinNumWinnersConfirmed(false)
  }

  const confirmSplitWinNumWinners = () => {
    if (numWinnersValue <= 0) return
    withTyping(() => setSplitWinNumWinnersConfirmed(true))
  }

  const confirmSplitWinThreshold = () => {
    if (hasInvalidSplitWinConfiguration) return
    withTyping(() => setSplitWinThresholdConfirmed(true))
  }

  const updateTitle = (value: string) => {
    update("title", value)
    setTitleConfirmed(false)
  }

  const addApp = (appId: string) => {
    if (hasReachedSelectedAppsLimit || form.appIds.includes(appId)) return
    update("appIds", [...form.appIds, appId])
    setAppResultsPage(0)
    setAppsConfirmed(false)
  }

  const removeApp = (appId: string) => {
    update(
      "appIds",
      form.appIds.filter(id => id !== appId),
    )
    setAppResultsPage(0)
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
    setAppSearch("")
    setAppResultsPage(0)
    if (value === "all") {
      update("appIds", [])
      setAppsConfirmed(false)
      withTyping(() => setAppScope(value))
    } else {
      setAppsConfirmed(false)
      setAppScope(value)
    }
  }

  const confirmAmount = () => {
    if (stakeAmountWei === 0n || hasInsufficientB3tr || hasBelowMinimumBetAmount) return
    withTyping(() => setAmountConfirmed(true))
  }

  const confirmTitle = () => {
    if (hasTitleTooLong) return
    withTyping(() => setTitleConfirmed(true))
  }

  const confirmStartRound = () => {
    if (hasInvalidStartRound) return
    withTyping(() => setStartRoundChosen(true))
  }

  const confirmSelectedApps = () => {
    if (form.appIds.length === 0) {
      setAppSearch("")
      setAppResultsPage(0)
      setAppScope("all")
      withTyping(() => setAppsConfirmed(true))
      return
    }
    withTyping(() => setAppsConfirmed(true))
  }

  const confirmInvitees = (skip = false) => {
    if (!skip && !canConfirmInvitees) return
    update("invitees", skip ? [] : sanitizedInvitees)
    withTyping(() => setInviteesConfirmed(true))
  }

  const canUseAmount = (value: string) => {
    const parsedAmount = parseAmount(value)
    if (parsedAmount === 0n) return false
    if (parsedAmount < minBetAmountWei) return false
    if (!account?.address || isB3trBalanceLoading) return true
    return parsedAmount <= BigInt(b3trBalance?.original ?? "0")
  }

  const resetFrom = (stepKey: Exclude<ChallengeFlowStep, "review">) => {
    const index = STEP_ORDER.indexOf(stepKey)
    if (index <= STEP_ORDER.indexOf("kind")) setKindChosen(false)
    if (index <= STEP_ORDER.indexOf("visibility")) setVisibilityChosen(false)
    if (index <= STEP_ORDER.indexOf("challengeType")) setChallengeTypeChosen(false)
    if (index <= STEP_ORDER.indexOf("typeExplainer")) setTypeExplainerSeen(false)
    if (index <= STEP_ORDER.indexOf("splitWinNumWinners")) setSplitWinNumWinnersConfirmed(false)
    if (index <= STEP_ORDER.indexOf("splitWinThreshold")) setSplitWinThresholdConfirmed(false)
    if (index <= STEP_ORDER.indexOf("title")) setTitleConfirmed(false)
    if (index <= STEP_ORDER.indexOf("amount")) setAmountConfirmed(false)
    if (index <= STEP_ORDER.indexOf("startRound")) setStartRoundChosen(false)
    if (index <= STEP_ORDER.indexOf("duration")) setDurationChosen(false)
    if (index <= STEP_ORDER.indexOf("appScope")) {
      setAppScope(null)
      setAppsConfirmed(false)
    }
    if (index <= STEP_ORDER.indexOf("selectedApps")) setAppsConfirmed(false)
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
    !hasBelowMinimumBetAmount &&
    !hasInvalidSplitWinConfiguration &&
    !hasMetadataLengthError &&
    !isResolvingInvitees &&
    !hasInviteeErrors

  const handleSubmit = () => {
    if (!canSubmit) return
    const parsed: CreateChallengeFormData = {
      ...form,
      invitees: sanitizedInvitees,
      title: form.title.trim(),
      description: form.description.trim(),
      imageURI: form.imageURI.trim(),
      metadataURI: form.metadataURI.trim(),
    }
    pendingCreateRef.current = true
    actions.createChallenge(parsed)
    setOpen(false)
  }

  return {
    open,
    form,
    isTyping,
    appScope,
    appSearch,
    appResultsPage,
    messagesEndRef,

    // derived
    stakeAmountWei,
    minBetAmountWei,
    hasInsufficientB3tr,
    hasBelowMinimumBetAmount,
    hasTitleTooLong,
    thresholdValue,
    numWinnersValue,
    splitWinPrizePerWinner,
    hasInvalidSplitWinConfiguration,
    minStartRound,
    hasInvalidStartRound,
    duration,
    isSponsored,
    isPrivate,
    isSplitWin,
    needsVisibilityChoice,
    needsChallengeTypeChoice,
    hasReachedSelectedAppsLimit,
    canSubmit,
    filteredApps,
    selectedAppNames,
    b3trBalance,
    isB3trBalanceLoading,
    appsData,
    isAppsLoading,
    inviteeErrorKeys,
    canConfirmInvitees,
    metadataLengthError,

    // step flags
    kindChosen,
    visibilityChosen,
    challengeTypeChosen,
    typeExplainerSeen,
    splitWinNumWinnersConfirmed,
    splitWinThresholdConfirmed,
    titleConfirmed,
    amountConfirmed,
    startRoundChosen,
    durationChosen,
    appsConfirmed,
    inviteesConfirmed,

    // actions
    handleOpen,
    handleSubmit,
    resetFrom,
    updateKind,
    chooseVisibility,
    setChallengeType: setChallengeTypeChoice,
    acknowledgeTypeExplainer,
    updateTitle,
    confirmTitle,
    confirmAmount,
    chooseStartRound,
    confirmStartRound,
    chooseDuration,
    updateThreshold,
    updateNumWinners,
    confirmSplitWinNumWinners,
    confirmSplitWinThreshold,
    chooseAppScope,
    confirmSelectedApps,
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
    setAppResultsPage,
    setAppsConfirmed,
    setAmountConfirmed,
    setStartRoundChosen,
    setStartRoundValue,
  }
}

export type CreateChallengeFlow = ReturnType<typeof useCreateChallengeFlow>

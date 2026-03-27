"use client"

import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  HStack,
  IconButton,
  Input,
  Portal,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { parseEther } from "ethers"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuPlus, LuX } from "react-icons/lu"

import { ChallengeKind, ChallengeVisibility, ThresholdMode } from "@/api/challenges/types"
import { CreateChallengeFormData, useChallengeActions } from "@/api/challenges/useChallengeActions"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"

interface CreateChallengeModalProps {
  defaultKind: number
  currentRound: number
  children: React.ReactNode
}

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

export const CreateChallengeModal = ({ defaultKind, currentRound, children }: CreateChallengeModalProps) => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateChallengeFormData>(initialForm(defaultKind, currentRound))
  const [appSearch, setAppSearch] = useState("")
  const [showAppDropdown, setShowAppDropdown] = useState(false)
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>()
  const { account } = useWallet()
  const actions = useChallengeActions()
  const { t } = useTranslation()
  const { data: appsData } = useXApps({ filterBlacklisted: true })
  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useGetB3trBalance(account?.address ?? undefined)

  const filteredApps = useMemo(() => {
    if (!appsData?.allApps) return []
    const q = appSearch.toLowerCase()
    return appsData.allApps.filter(
      app => !form.appIds.includes(app.id) && (app.name.toLowerCase().includes(q) || app.id.toLowerCase().includes(q)),
    )
  }, [appsData, appSearch, form.appIds])
  const stakeAmountWei = useMemo(() => {
    if (!form.stakeAmount) return 0n

    try {
      return parseEther(form.stakeAmount)
    } catch {
      return 0n
    }
  }, [form.stakeAmount])
  const hasInsufficientB3tr =
    !!account?.address &&
    !isB3trBalanceLoading &&
    stakeAmountWei > 0n &&
    stakeAmountWei > BigInt(b3trBalance?.original ?? "0")
  const thresholdValue = Number(form.threshold || "0")
  const hasInvalidThresholdConfiguration =
    form.kind === ChallengeKind.Sponsored && thresholdValue > 0 && form.thresholdMode === ThresholdMode.None
  const minStartRound = currentRound + 1
  const hasInvalidStartRound = form.startRound <= currentRound
  const hasInvalidEndRound = form.endRound < form.startRound

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
  }

  const updateThreshold = (value: string) => {
    const normalizedThreshold =
      value === "" ? "0" : String(Math.max(0, Math.trunc(Number.isFinite(Number(value)) ? Number(value) : 0)))

    setForm(prev => ({
      ...prev,
      threshold: normalizedThreshold,
      thresholdMode:
        Number(normalizedThreshold) > 0
          ? prev.thresholdMode === ThresholdMode.None
            ? ThresholdMode.SplitAboveThreshold
            : prev.thresholdMode
          : ThresholdMode.None,
    }))
  }

  const addApp = (appId: string) => {
    update("appIds", [...form.appIds, appId])
    setAppSearch("")
    setShowAppDropdown(false)
  }

  const removeApp = (appId: string) => {
    update(
      "appIds",
      form.appIds.filter(id => id !== appId),
    )
  }

  const updateInvitee = (index: number, value: string) => {
    const next = [...form.invitees]
    next[index] = value
    update("invitees", next)
  }

  const addInvitee = () => update("invitees", [...form.invitees, ""])

  const removeInvitee = (index: number) => {
    update(
      "invitees",
      form.invitees.filter((_, i) => i !== index),
    )
  }

  const handleOpen = (e: { open: boolean }) => {
    if (e.open) {
      setForm(initialForm(defaultKind, currentRound))
      setAppSearch("")
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

  const isSponsored = form.kind === ChallengeKind.Sponsored
  const isPrivate = form.visibility === ChallengeVisibility.Private
  const canSubmit =
    !!account?.address &&
    !isB3trBalanceLoading &&
    stakeAmountWei > 0n &&
    !hasInvalidStartRound &&
    !hasInvalidEndRound &&
    !hasInsufficientB3tr &&
    !hasInvalidThresholdConfiguration
  const titleKey = isSponsored ? "Create sponsored challenge" : "Create stake challenge"
  const amountLabelKey = isSponsored ? "Prize amount (B3TR)" : "Stake amount (B3TR)"

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "95vw", md: "lg" }}>
            <Dialog.Header pb="5">
              <Dialog.Title>{t(titleKey)}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap="4">
                <VStack align="stretch" gap="2">
                  <HStack gap="2">
                    <Button
                      size="sm"
                      variant={form.kind === ChallengeKind.Stake ? "primary" : "tertiary"}
                      onClick={() => updateKind(ChallengeKind.Stake)}>
                      {t("Stake")}
                    </Button>
                    <Button
                      size="sm"
                      variant={form.kind === ChallengeKind.Sponsored ? "primary" : "tertiary"}
                      onClick={() => updateKind(ChallengeKind.Sponsored)}>
                      {t("Sponsored")}
                    </Button>
                  </HStack>
                  <Text textStyle="xs" color="text.subtle">
                    {t(
                      form.kind === ChallengeKind.Stake
                        ? "Stake challenge type description"
                        : "Sponsored challenge type description",
                    )}
                  </Text>
                </VStack>

                <Field.Root invalid={hasInsufficientB3tr}>
                  <Field.Label>{t(amountLabelKey)}</Field.Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={form.stakeAmount}
                    onChange={e => update("stakeAmount", e.target.value)}
                  />
                  <Skeleton loading={isB3trBalanceLoading}>
                    <Text textStyle="xs" color="text.subtle">
                      {t("Your B3TR balance")}
                      {":"} {b3trBalance?.formatted ?? "0"}
                    </Text>
                  </Skeleton>
                  {hasInsufficientB3tr && <Field.ErrorText>{t("Insufficient balance")}</Field.ErrorText>}
                </Field.Root>

                <HStack gap="4">
                  <Field.Root invalid={hasInvalidStartRound}>
                    <Field.Label>{t("Start round")}</Field.Label>
                    <Input
                      type="number"
                      min={minStartRound}
                      value={form.startRound}
                      onChange={e => {
                        const start = Math.max(minStartRound, Number(e.target.value))
                        setForm(prev => ({
                          ...prev,
                          startRound: start,
                          endRound: Math.min(Math.max(prev.endRound, start), start + 3),
                        }))
                      }}
                    />
                  </Field.Root>
                  <Field.Root invalid={hasInvalidEndRound}>
                    <Field.Label>{t("End round")}</Field.Label>
                    <Input
                      type="number"
                      min={form.startRound}
                      max={form.startRound + 3}
                      value={form.endRound}
                      onChange={e => {
                        const end = Number(e.target.value)
                        update("endRound", Math.min(Math.max(form.startRound, end), form.startRound + 3))
                      }}
                    />
                  </Field.Root>
                </HStack>

                <Text textStyle="xs" color="text.subtle">
                  {t("Duration: {{count}} rounds", {
                    count: Math.max(0, form.endRound - form.startRound + 1),
                  })}
                </Text>

                {isSponsored && (
                  <>
                    <Field.Root>
                      <Field.Label>{t("Threshold")}</Field.Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={form.threshold}
                        onChange={e => updateThreshold(e.target.value)}
                      />
                    </Field.Root>

                    {thresholdValue > 0 && (
                      <VStack align="stretch" gap="2">
                        <HStack gap="2">
                          <Button
                            size="sm"
                            variant={form.thresholdMode === ThresholdMode.SplitAboveThreshold ? "primary" : "tertiary"}
                            onClick={() => update("thresholdMode", ThresholdMode.SplitAboveThreshold)}>
                            {t("Split above threshold")}
                          </Button>
                          <Button
                            size="sm"
                            variant={form.thresholdMode === ThresholdMode.TopAboveThreshold ? "primary" : "tertiary"}
                            onClick={() => update("thresholdMode", ThresholdMode.TopAboveThreshold)}>
                            {t("Top above threshold")}
                          </Button>
                        </HStack>
                        <Text textStyle="xs" color="text.subtle">
                          {t(
                            form.thresholdMode === ThresholdMode.TopAboveThreshold
                              ? "Top above threshold description"
                              : "Split above threshold description",
                          )}
                        </Text>
                      </VStack>
                    )}
                  </>
                )}

                <Field.Root>
                  <Field.Label>{t("Apps (leave empty for all)")}</Field.Label>
                  <Box position="relative">
                    <Input
                      placeholder={t("Search apps...")}
                      value={appSearch}
                      onChange={e => {
                        setAppSearch(e.target.value)
                        setShowAppDropdown(true)
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
                  {form.appIds.length > 0 && (
                    <VStack align="stretch" gap="1" mt="2" w="full">
                      {form.appIds.map(appId => {
                        const app = appsData?.allApps.find(a => a.id === appId)
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
                </Field.Root>

                <VStack align="stretch" gap="2">
                  <HStack gap="2">
                    <Button
                      size="sm"
                      variant={form.visibility === ChallengeVisibility.Public ? "primary" : "tertiary"}
                      onClick={() => update("visibility", ChallengeVisibility.Public)}>
                      {t("Public")}
                    </Button>
                    <Button
                      size="sm"
                      variant={form.visibility === ChallengeVisibility.Private ? "primary" : "tertiary"}
                      onClick={() => update("visibility", ChallengeVisibility.Private)}>
                      {t("Private")}
                    </Button>
                  </HStack>
                  <Text textStyle="xs" color="text.subtle">
                    {t(
                      form.visibility === ChallengeVisibility.Public
                        ? "Public challenge visibility description"
                        : "Private challenge visibility description",
                    )}
                  </Text>
                </VStack>

                {isPrivate && (
                  <Field.Root>
                    <Field.Label>{t("Invitees")}</Field.Label>
                    <VStack align="stretch" gap="2" w="full">
                      {form.invitees.map((addr, i) => (
                        <HStack key={i} gap="2">
                          <Input placeholder="0x..." value={addr} onChange={e => updateInvitee(i, e.target.value)} />
                          <IconButton size="sm" variant="ghost" onClick={() => removeInvitee(i)} aria-label="Remove">
                            <LuX />
                          </IconButton>
                        </HStack>
                      ))}
                      <Button size="sm" variant="tertiary" onClick={addInvitee}>
                        <LuPlus />
                        {t("Add invitee")}
                      </Button>
                    </VStack>
                  </Field.Root>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="secondary">{t("Cancel")}</Button>
              </Dialog.ActionTrigger>
              <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
                {t("Create")}
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

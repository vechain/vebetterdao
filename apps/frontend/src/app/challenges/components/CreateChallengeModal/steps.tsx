import {
  Box,
  Button,
  Field,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
  Wrap,
} from "@chakra-ui/react"
import { TFunction } from "i18next"
import { ReactNode } from "react"
import { LuChevronLeft, LuChevronRight, LuPlus, LuX } from "react-icons/lu"

import { ChallengeKind, ChallengeVisibility } from "@/api/challenges/types"

import { SummaryItem } from "./ChatBubbles"
import {
  getChoiceVariant,
  primaryVariant,
  QUICK_AMOUNTS,
  QUICK_THRESHOLDS,
  tertiaryVariant,
  type ChallengeFlowStep,
} from "./types"
import type { CreateChallengeFlow } from "./useCreateChallengeFlow"

export interface StepDefinition {
  key: ChallengeFlowStep
  isRelevant: boolean
  isComplete: boolean
  prompt: ReactNode
  answer?: ReactNode
  controls: ReactNode
}

const APP_RESULTS_PAGE_SIZE = 8

export const buildSteps = (flow: CreateChallengeFlow, t: TFunction): StepDefinition[] => {
  const {
    form,
    isSponsored,
    isSplitPrize,
    isPrivate,
    appScope,
    duration,
    thresholdValue,
    minStartRound,
    hasInsufficientB3tr,
    hasInvalidStartRound,
    hasReachedSelectedAppsLimit,
    stakeAmountWei,
    b3trBalance,
    isB3trBalanceLoading,
    filteredApps,
    appResultsPage,
    selectedAppNames,
    appsData,
    isAppsLoading,
    appSearch,

    kindChosen,
    amountConfirmed,
    startRoundChosen,
    durationChosen,
    winnerChosen,
    thresholdConfirmed,
    appsConfirmed,
    visibilityChosen,
    inviteesConfirmed,
  } = flow

  const amountLabelKey = isSponsored ? "Prize amount (B3TR)" : "Bet amount (B3TR)"
  const currentQuickStartRounds = [minStartRound, minStartRound + 1, minStartRound + 2]
  const inviteesPreview = form.invitees.length === 0 ? t("Skip") : getCompactListLabel(form.invitees)
  const selectedAppsPreview = appScope === "all" ? t("All apps") : getCompactListLabel(selectedAppNames)
  const getExplicitChoiceVariant = (isChosen: boolean, isActive: boolean) => getChoiceVariant(isChosen && isActive)
  const maxAppResultsPage = Math.max(0, Math.ceil(filteredApps.length / APP_RESULTS_PAGE_SIZE) - 1)
  const currentAppResultsPage = Math.min(appResultsPage, maxAppResultsPage)
  const currentAppResults = filteredApps.slice(
    currentAppResultsPage * APP_RESULTS_PAGE_SIZE,
    (currentAppResultsPage + 1) * APP_RESULTS_PAGE_SIZE,
  )
  const hasPreviousAppsPage = currentAppResultsPage > 0
  const hasNextAppsPage = currentAppResultsPage < maxAppResultsPage
  const appResultsStart = filteredApps.length === 0 ? 0 : currentAppResultsPage * APP_RESULTS_PAGE_SIZE + 1
  const appResultsEnd =
    filteredApps.length === 0 ? 0 : currentAppResultsPage * APP_RESULTS_PAGE_SIZE + currentAppResults.length
  const updateAppFilter = (value: string) => {
    flow.setAppSearch(value)
    flow.setAppResultsPage(0)
    flow.setAppsConfirmed(false)
  }
  const clearAppFilter = () => updateAppFilter("")

  return [
    {
      key: "kind",
      isRelevant: true,
      isComplete: kindChosen,
      prompt: (
        <VStack align="start" gap="1" w="full">
          <Text textStyle="sm">{t("Hi, I'm B3MO. I'll guide you through your challenge setup.")}</Text>
          <Text textStyle="sm" fontWeight="semibold">
            {t("Choose challenge type")}
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t(form.kind === ChallengeKind.Stake ? "Bet" : "Sponsored")}
        </Text>
      ),
      controls: (
        <VStack align="stretch" gap="2" w="full">
          <Box
            as="button"
            w="full"
            textAlign="left"
            bg="bg.primary"
            color="text.default"
            borderRadius="xl"
            px={{ base: "4", md: "5" }}
            py="4"
            border="1px solid"
            borderColor="border.secondary"
            boxShadow="sm"
            transition="all 0.2s ease"
            _hover={{ borderColor: "border.active", bg: "actions.secondary.default" }}
            onClick={() => flow.updateKind(ChallengeKind.Stake)}>
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
            bg="bg.primary"
            color="text.default"
            borderRadius="xl"
            px={{ base: "4", md: "5" }}
            py="4"
            border="1px solid"
            borderColor="border.secondary"
            boxShadow="sm"
            transition="all 0.2s ease"
            _hover={{ borderColor: "border.active", bg: "actions.secondary.default" }}
            onClick={() => flow.updateKind(ChallengeKind.Sponsored)}>
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
      key: "amount",
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
        <VStack align="stretch" gap="3">
          <HStack gap="2" flexWrap="wrap">
            {QUICK_AMOUNTS.map(value => (
              <Button
                key={value}
                size="sm"
                variant={getExplicitChoiceVariant(amountConfirmed, form.stakeAmount === value)}
                onClick={() => {
                  flow.update("stakeAmount", value)
                  if (flow.canUseAmount(value)) flow.withTyping(() => flow.setAmountConfirmed(true))
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
                flow.update("stakeAmount", e.target.value)
                flow.setAmountConfirmed(false)
              }}
            />
            {hasInsufficientB3tr && <Field.ErrorText>{t("Insufficient balance")}</Field.ErrorText>}
          </Field.Root>
          <HStack justify="flex-end">
            <Button
              size="sm"
              variant={primaryVariant}
              disabled={stakeAmountWei === 0n || hasInsufficientB3tr}
              onClick={flow.confirmAmount}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "startRound",
      isRelevant: true,
      isComplete: startRoundChosen,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("Start round")}
        </Text>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t("Start round")}
          {": "}
          {form.startRound}
        </Text>
      ),
      controls: (
        <VStack align="stretch" gap="3">
          <HStack gap="2" flexWrap="wrap">
            {currentQuickStartRounds.map(value => (
              <Button
                key={value}
                size="sm"
                variant={getExplicitChoiceVariant(startRoundChosen, form.startRound === value)}
                onClick={() => flow.chooseStartRound(value)}>
                {value === minStartRound ? t("Next round") : `+${value - (minStartRound - 1)}`}
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
                flow.setStartRoundValue(Number(e.target.value))
                flow.setStartRoundChosen(false)
              }}
            />
          </Field.Root>
          <HStack justify="flex-end">
            <Button size="sm" variant={primaryVariant} disabled={hasInvalidStartRound} onClick={flow.confirmStartRound}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "duration",
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
        <HStack gap="2" flexWrap="wrap">
          {[1, 2, 3, 4].map(value => (
            <Button
              key={value}
              size="sm"
              variant={getExplicitChoiceVariant(durationChosen, duration === value)}
              onClick={() => flow.chooseDuration(value)}>
              {value}
            </Button>
          ))}
        </HStack>
      ),
    },
    {
      key: "winner",
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
        <HStack gap="2" flexWrap="wrap">
          <Button
            size="sm"
            variant={getExplicitChoiceVariant(winnerChosen, !isSplitPrize)}
            onClick={() => flow.setWinnerMode(false)}>
            {t("Max actions")}
          </Button>
          <Button
            size="sm"
            variant={getExplicitChoiceVariant(winnerChosen, isSplitPrize)}
            onClick={() => flow.setWinnerMode(true)}>
            {t("Split prize")}
          </Button>
        </HStack>
      ),
    },
    {
      key: "threshold",
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
        <VStack align="stretch" gap="3">
          <HStack gap="2" flexWrap="wrap">
            {QUICK_THRESHOLDS.map(value => (
              <Button
                key={value}
                size="sm"
                variant={getExplicitChoiceVariant(thresholdConfirmed, form.threshold === value)}
                onClick={() => {
                  flow.update("threshold", value)
                  flow.withTyping(() => flow.confirmThreshold())
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
              onChange={e => flow.updateThreshold(e.target.value)}
            />
            {thresholdValue === 0 && <Field.ErrorText>{t("Minimum actions must be greater than 0")}</Field.ErrorText>}
          </Field.Root>
          <HStack justify="flex-end">
            <Button size="sm" variant={primaryVariant} disabled={thresholdValue === 0} onClick={flow.confirmThreshold}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "appScope",
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
        <HStack gap="2" flexWrap="wrap">
          <Button
            size="sm"
            variant={getExplicitChoiceVariant(appScope !== null, appScope === "all")}
            onClick={() => flow.chooseAppScope("all")}>
            {t("All apps")}
          </Button>
          <Button
            size="sm"
            variant={getExplicitChoiceVariant(appScope !== null, appScope === "selected")}
            onClick={() => flow.chooseAppScope("selected")}>
            {t("Selected apps")}
          </Button>
        </HStack>
      ),
    },
    {
      key: "selectedApps",
      isRelevant: appScope === "selected",
      isComplete: appsConfirmed,
      prompt: (
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" fontWeight="semibold">
            {t("Select up to {{count}} apps", { count: 5 })}
          </Text>
          <Text textStyle="xs" color="text.subtle">
            {form.appIds.length}
            {"/"}
            {5}
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {selectedAppsPreview}
        </Text>
      ),
      controls: (
        <VStack align="stretch" gap="3">
          {form.appIds.length > 0 && (
            <Box px="3" py="3" borderRadius="xl" bg="bg.muted" border="1px solid" borderColor="border.secondary">
              <VStack align="stretch" gap="3">
                <HStack justify="space-between" gap="2">
                  <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                    {t("Selected apps")}
                  </Text>
                  <Text textStyle="xs" color="text.subtle">
                    {form.appIds.length}
                    {"/"}
                    {5}
                  </Text>
                </HStack>
                <Wrap gap="2">
                  {form.appIds.map(appId => {
                    const app = appsData?.allApps.find(candidate => candidate.id === appId)
                    return (
                      <HStack
                        key={appId}
                        gap="1.5"
                        maxW="full"
                        px="3"
                        py="2"
                        borderRadius="full"
                        bg="bg.primary"
                        border="1px solid"
                        borderColor="border.secondary"
                        boxShadow="sm">
                        <Text textStyle="sm" minW="0">
                          {app?.name ?? appId}
                        </Text>
                        <IconButton
                          size="2xs"
                          variant="ghost"
                          borderRadius="full"
                          onClick={() => flow.removeApp(appId)}
                          aria-label={t("Remove")}>
                          <LuX />
                        </IconButton>
                      </HStack>
                    )
                  })}
                </Wrap>
              </VStack>
            </Box>
          )}
          <HStack align="end" gap="2">
            <Field.Root flex="1" minW="0">
              <Field.Label>{t("Apps (leave empty for all)")}</Field.Label>
              <Input
                placeholder={t("Search apps...")}
                value={appSearch}
                borderRadius="full"
                onChange={e => updateAppFilter(e.target.value)}
              />
            </Field.Root>
            {appSearch ? (
              <Button size="sm" variant={tertiaryVariant} onClick={clearAppFilter}>
                {t("Clear")}
              </Button>
            ) : null}
          </HStack>
          <Text textStyle="xs" color="text.subtle">
            {filteredApps.length > 0
              ? `${t("Showing")} ${appResultsStart}-${appResultsEnd} / ${filteredApps.length}`
              : ""}
          </Text>
          {isAppsLoading ? (
            <SimpleGrid columns={{ base: 2, md: 2 }} gap="2">
              {["app-skeleton-1", "app-skeleton-2", "app-skeleton-3", "app-skeleton-4"].map(key => (
                <Skeleton key={key} h="10" borderRadius="lg" />
              ))}
            </SimpleGrid>
          ) : currentAppResults.length > 0 ? (
            <SimpleGrid columns={{ base: 2, md: 2 }} gap="2">
              {currentAppResults.map(app => (
                <Button
                  key={app.id}
                  size="sm"
                  variant={tertiaryVariant}
                  justifyContent="flex-start"
                  minH="10"
                  h="auto"
                  py="2"
                  px="4"
                  textAlign="left"
                  textStyle="sm"
                  whiteSpace="normal"
                  disabled={hasReachedSelectedAppsLimit}
                  onClick={() => flow.addApp(app.id)}>
                  {app.name}
                </Button>
              ))}
            </SimpleGrid>
          ) : (
            <Box px="3" py="3" borderRadius="md" bg="bg.muted">
              <Text textStyle="sm" color="text.subtle">
                {t("No apps found")}
              </Text>
            </Box>
          )}
          {(hasPreviousAppsPage || hasNextAppsPage) && (
            <HStack justify="space-between">
              <IconButton
                size="sm"
                variant={tertiaryVariant}
                disabled={!hasPreviousAppsPage}
                aria-label={t("Back")}
                onClick={() => flow.setAppResultsPage(currentAppResultsPage - 1)}>
                <LuChevronLeft />
              </IconButton>
              <IconButton
                size="sm"
                variant={tertiaryVariant}
                disabled={!hasNextAppsPage}
                aria-label={t("Next")}
                onClick={() => flow.setAppResultsPage(currentAppResultsPage + 1)}>
                <LuChevronRight />
              </IconButton>
            </HStack>
          )}
          <HStack justify="flex-end">
            <Button
              size="sm"
              variant={primaryVariant}
              disabled={form.appIds.length === 0}
              onClick={flow.confirmSelectedApps}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "visibility",
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
        <HStack gap="2" flexWrap="wrap">
          <Button
            size="sm"
            variant={getExplicitChoiceVariant(visibilityChosen, form.visibility === ChallengeVisibility.Public)}
            onClick={() => flow.chooseVisibility(ChallengeVisibility.Public)}>
            {t("Public")}
          </Button>
          <Button
            size="sm"
            variant={getExplicitChoiceVariant(visibilityChosen, form.visibility === ChallengeVisibility.Private)}
            onClick={() => flow.chooseVisibility(ChallengeVisibility.Private)}>
            {t("Private")}
          </Button>
        </HStack>
      ),
    },
    {
      key: "invitees",
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
        <VStack align="stretch" gap="3">
          {form.invitees.length > 0 && (
            <VStack align="stretch" gap="2" w="full">
              {form.invitees.map((addr, index) => (
                <HStack key={`invitee-${addr || index}`} gap="2">
                  <Input placeholder="0x..." value={addr} onChange={e => flow.updateInvitee(index, e.target.value)} />
                  <IconButton size="sm" variant="ghost" onClick={() => flow.removeInvitee(index)} aria-label="Remove">
                    <LuX />
                  </IconButton>
                </HStack>
              ))}
            </VStack>
          )}
          <Button size="sm" variant={tertiaryVariant} alignSelf="start" onClick={flow.addInvitee}>
            <LuPlus />
            {t("Add invitee")}
          </Button>
          <HStack justify="flex-end" flexWrap="wrap">
            <Button size="sm" variant={tertiaryVariant} onClick={() => flow.confirmInvitees(true)}>
              {t("Skip")}
            </Button>
            <Button size="sm" variant={primaryVariant} onClick={() => flow.confirmInvitees(false)}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "review",
      isRelevant: true,
      isComplete: false,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("Review your challenge")}
        </Text>
      ),
      controls: (
        <Box w="full">
          <Box
            bg="bg.primary"
            borderRadius="2xl"
            px={{ base: "4", md: "5" }}
            py={{ base: "4", md: "5" }}
            border="1px solid"
            borderColor="border.secondary"
            boxShadow="sm">
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
}

function getCompactListLabel(items: string[]) {
  if (items.length === 0) return ""
  if (items.length <= 2) return items.join(", ")
  return `${items.slice(0, 2).join(", ")}, +${items.length - 2}`
}

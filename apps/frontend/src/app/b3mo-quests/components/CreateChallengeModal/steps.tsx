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
import { formatEther } from "ethers"
import { TFunction } from "i18next"
import { ReactNode, useState } from "react"
import { LuChevronLeft, LuChevronRight, LuPlus, LuX } from "react-icons/lu"

import { challengeMetadataByteLimits, ChallengeKind, ChallengeType, ChallengeVisibility } from "@/api/challenges/types"
import { AppImage } from "@/components/AppImage/AppImage"

import { getInviteeValidationMessage, InviteeValidationError } from "../../shared/inviteeValidation"

import { SummaryItem } from "./ChatBubbles"
import {
  getChoiceVariant,
  getMinimumBetQuickAmounts,
  MAX_THRESHOLD,
  primaryVariant,
  QUICK_NUM_WINNERS,
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

const formatWei = (value: bigint) => {
  const formatted = formatEther(value)
  const [whole = formatted, decimal] = formatted.split(".")
  if (!decimal) return whole
  const trimmedDecimal = decimal.replace(/0+$/, "").slice(0, 4)
  return trimmedDecimal ? `${whole}.${trimmedDecimal}` : whole
}

/**
 * Returns the i18n key of the explainer message that matches the locked-in (kind, visibility, type) combination.
 */
const getTypeExplainerKey = (kind: number, visibility: number, challengeType: number): string => {
  if (kind === ChallengeKind.Stake)
    return "Each participant stakes the same amount; the participant with the most actions wins the pool. Up to 100 participants."
  if (visibility === ChallengeVisibility.Public)
    return "Split Win — multiple winners share the prize. The fastest to complete all actions and claim the prize win."
  return challengeType === ChallengeType.SplitWin
    ? "Split Win — multiple winners share the prize. The fastest to complete all actions and claim the prize win."
    : "Max Actions — invitees compete; the one with the most actions wins the sponsor pool. Up to 100 participants."
}

export const buildSteps = (flow: CreateChallengeFlow, t: TFunction): StepDefinition[] => {
  const {
    form,
    isSponsored,
    isSplitWin,
    isPrivate,
    appScope,
    duration,
    numWinnersValue,
    splitWinPrizePerWinner,
    hasInvalidSplitWinConfiguration,
    minStartRound,
    hasInsufficientB3tr,
    hasInvalidStartRound,
    hasReachedSelectedAppsLimit,
    stakeAmountWei,
    minBetAmountWei,
    b3trBalance,
    isB3trBalanceLoading,
    filteredApps,
    appResultsPage,
    selectedAppNames,
    appsData,
    isAppsLoading,
    appSearch,
    inviteeErrorKeys,
    canConfirmInvitees,
    hasBelowMinimumBetAmount,
    hasTitleTooLong,
    needsVisibilityChoice,
    needsChallengeTypeChoice,

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
    typeFinalized,
  } = flow

  const amountLabelKey = isSponsored ? "Total prize pool amount (B3TR)" : "Bet amount (B3TR)"
  const quickAmounts = getMinimumBetQuickAmounts(minBetAmountWei)
  const minimumBetAmount = quickAmounts[0] ?? "100"
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
          <Text textStyle="sm">{t("Hi, I'm B3MO. I'll guide you through your B3MO quest setup.")}</Text>
          <Text textStyle="sm" fontWeight="semibold">
            {t("Choose B3MO quest type")}
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t(form.kind === ChallengeKind.Stake ? "Bet" : "Sponsored")}
        </Text>
      ),
      controls: (
        <VStack align="stretch" gap="2" w="80%" ml="auto">
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
              {t("Private B3MO Quest. Each participant bets the same amount. Winners split the prize pool.")}
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
              {t("The creator provides the prize pool. Winners are selected based on completed actions.")}
            </Text>
          </Box>
        </VStack>
      ),
    },
    {
      key: "visibility",
      isRelevant: needsVisibilityChoice,
      isComplete: visibilityChosen,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("Who can join?")}
        </Text>
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
      key: "challengeType",
      isRelevant: needsChallengeTypeChoice,
      isComplete: challengeTypeChosen,
      prompt: (
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" fontWeight="semibold">
            {t("Pick the B3MO quest mechanic")}
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t(form.challengeType === ChallengeType.SplitWin ? "Split win" : "Max actions")}
        </Text>
      ),
      controls: (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="2" w="full">
          <Button
            size="sm"
            h="auto"
            minH="unset"
            w="full"
            borderRadius="xl"
            px="4"
            py="3"
            justifyContent="flex-start"
            textAlign="left"
            whiteSpace="normal"
            variant={getExplicitChoiceVariant(challengeTypeChosen, form.challengeType === ChallengeType.MaxActions)}
            onClick={() => flow.setChallengeType(ChallengeType.MaxActions)}>
            <VStack align="start" gap="1" w="full">
              <Text textStyle="sm" fontWeight="semibold" color="inherit">
                {t("Max actions")}
              </Text>
              <Text textStyle="xs" color="inherit" opacity={0.8}>
                {t("Max actions description")}
              </Text>
            </VStack>
          </Button>
          <Button
            size="sm"
            h="auto"
            minH="unset"
            w="full"
            borderRadius="xl"
            px="4"
            py="3"
            justifyContent="flex-start"
            textAlign="left"
            whiteSpace="normal"
            variant={getExplicitChoiceVariant(challengeTypeChosen, form.challengeType === ChallengeType.SplitWin)}
            onClick={() => flow.setChallengeType(ChallengeType.SplitWin)}>
            <VStack align="start" gap="1" w="full">
              <Text textStyle="sm" fontWeight="semibold" color="inherit">
                {t("Split win")}
              </Text>
              <Text textStyle="xs" color="inherit" opacity={0.8}>
                {t("Split win description")}
              </Text>
            </VStack>
          </Button>
        </SimpleGrid>
      ),
    },
    {
      key: "typeExplainer",
      isRelevant: typeFinalized,
      isComplete: typeExplainerSeen,
      prompt: (
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" fontWeight="semibold">
            {t("B3MO Quest type")}
          </Text>
          <Text textStyle="sm" color="inherit">
            {t(getTypeExplainerKey(form.kind, form.visibility, form.challengeType) as never)}
          </Text>
        </VStack>
      ),
      controls: null,
    },
    {
      key: "title",
      isRelevant: true,
      isComplete: titleConfirmed,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("Title (optional)")}
        </Text>
      ),
      answer: (
        <Text textStyle="sm" color="inherit" wordBreak="break-word" overflowWrap="anywhere">
          {form.title || t("Skip")}
        </Text>
      ),
      controls: (
        <VStack align="stretch" gap="3">
          <Field.Root invalid={hasTitleTooLong}>
            <Input
              value={form.title}
              maxLength={challengeMetadataByteLimits.title}
              onChange={e => flow.updateTitle(e.target.value)}
            />
            {hasTitleTooLong && (
              <Field.ErrorText>{t("{{fieldName}} is too long", { fieldName: t("Title (optional)") })}</Field.ErrorText>
            )}
          </Field.Root>
          <HStack justify="flex-end">
            <Button size="sm" variant={primaryVariant} disabled={hasTitleTooLong} onClick={flow.confirmTitle}>
              {t("Continue")}
            </Button>
          </HStack>
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
            {quickAmounts.map(value => (
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
          <Field.Root invalid={hasInsufficientB3tr || hasBelowMinimumBetAmount}>
            <Field.Label>{t(amountLabelKey)}</Field.Label>
            <Input
              type="number"
              min={minimumBetAmount}
              placeholder={minimumBetAmount}
              value={form.stakeAmount}
              onChange={e => {
                flow.update("stakeAmount", e.target.value)
                flow.setAmountConfirmed(false)
              }}
            />
            {hasBelowMinimumBetAmount && (
              <Field.ErrorText>{t("Minimum amount is {{amount}} B3TR", { amount: minimumBetAmount })}</Field.ErrorText>
            )}
            {hasInsufficientB3tr && <Field.ErrorText>{t("Insufficient balance")}</Field.ErrorText>}
          </Field.Root>
          <HStack justify="flex-end">
            <Button
              size="sm"
              variant={primaryVariant}
              disabled={stakeAmountWei === 0n || hasInsufficientB3tr || hasBelowMinimumBetAmount}
              onClick={flow.confirmAmount}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "splitWinNumWinners",
      isRelevant: isSplitWin,
      isComplete: splitWinNumWinnersConfirmed,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("How many winners will split the prize?")}
        </Text>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t("Number of winners")}
          {": "}
          {form.numWinners}
        </Text>
      ),
      controls: <NumWinnersControls flow={flow} t={t} />,
    },
    {
      key: "splitWinThreshold",
      isRelevant: isSplitWin,
      isComplete: splitWinThresholdConfirmed && !hasInvalidSplitWinConfiguration,
      prompt: (
        <Text textStyle="sm" fontWeight="semibold">
          {t("How many actions are needed to win?")}
        </Text>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t("Actions to claim a slot")}
          {": "}
          {form.threshold}
        </Text>
      ),
      controls: <ThresholdControls flow={flow} t={t} />,
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
            {t("How many rounds should it run?")}
          </Text>
        </VStack>
      ),
      answer: (
        <Text textStyle="sm" color="inherit">
          {t("Duration: {{count}} {{rounds}}", { count: duration, rounds: duration === 1 ? t("round") : t("rounds") })}
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
              {value} {value === 1 ? t("round") : t("rounds")}
            </Button>
          ))}
        </HStack>
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
          <Box px="3" py="3" borderRadius="xl" border="1px solid" borderColor="border.primary">
            <VStack align="stretch" gap="3">
              {form.appIds.length > 0 && (
                <>
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
                          justify="space-between"
                          gap="2"
                          w={{ base: "full", sm: "auto" }}
                          maxW={{ base: "full", sm: "xs" }}
                          minH="11"
                          px="3.5"
                          py="2.5"
                          borderRadius="2xl"
                          bg="bg.primary"
                          border="1px solid"
                          borderColor="border.primary">
                          <HStack gap="2.5" flex="1" minW="0">
                            <AppImage appId={appId} boxSize="5" borderRadius="md" flexShrink={0} />
                            <Text
                              textStyle="sm"
                              fontWeight="medium"
                              flex="1"
                              minW="0"
                              overflow="hidden"
                              textOverflow="ellipsis"
                              whiteSpace="nowrap">
                              {app?.name ?? appId}
                            </Text>
                          </HStack>
                          <IconButton
                            size="xs"
                            variant="ghost"
                            borderRadius="full"
                            flexShrink="0"
                            onClick={() => flow.removeApp(appId)}
                            aria-label={t("Remove")}>
                            <LuX />
                          </IconButton>
                        </HStack>
                      )
                    })}
                  </Wrap>
                </>
              )}
              <HStack align="end" gap="2">
                <Field.Root flex="1" minW="0">
                  <Field.Label>{t("Apps (leave empty for all)")}</Field.Label>
                  <Input
                    placeholder={t("Search apps...")}
                    value={appSearch}
                    borderRadius="full"
                    borderColor="border.primary"
                    _hover={{ borderColor: "border.primary" }}
                    onChange={e => updateAppFilter(e.target.value)}
                  />
                </Field.Root>
                {appSearch ? (
                  <Button size="sm" variant={tertiaryVariant} borderColor="border.primary" onClick={clearAppFilter}>
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
                      borderColor="border.primary"
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
                    borderColor="border.primary"
                    disabled={!hasPreviousAppsPage}
                    aria-label={t("Back")}
                    onClick={() => flow.setAppResultsPage(currentAppResultsPage - 1)}>
                    <LuChevronLeft />
                  </IconButton>
                  <IconButton
                    size="sm"
                    variant={tertiaryVariant}
                    borderColor="border.primary"
                    disabled={!hasNextAppsPage}
                    aria-label={t("Next")}
                    onClick={() => flow.setAppResultsPage(currentAppResultsPage + 1)}>
                    <LuChevronRight />
                  </IconButton>
                </HStack>
              )}
            </VStack>
          </Box>
          <HStack justify="flex-end">
            <Button size="sm" variant={primaryVariant} onClick={flow.confirmSelectedApps}>
              {form.appIds.length === 0 ? t("Use all apps") : t("Continue")}
            </Button>
          </HStack>
        </VStack>
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
                <InviteeRow
                  // Index-based key is intentional: using the value would remount the input
                  // on every keystroke and steal focus.
                  // eslint-disable-next-line react/no-array-index-key
                  key={`invitee-${index}`}
                  value={addr}
                  error={inviteeErrorKeys[index] ?? null}
                  onChange={value => flow.updateInvitee(index, value)}
                  onRemove={() => flow.removeInvitee(index)}
                  t={t}
                />
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
            <Button
              size="sm"
              variant={primaryVariant}
              disabled={!canConfirmInvitees}
              onClick={() => flow.confirmInvitees(false)}>
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
          {t("Review your B3MO quest")}
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
                label={t("Choose B3MO quest type")}
                value={t(form.kind === ChallengeKind.Stake ? "Bet" : "Sponsored")}
              />
              <SummaryItem
                label={t("B3MO Quest type")}
                value={t(form.challengeType === ChallengeType.SplitWin ? "Split win" : "Max actions")}
              />
              {isSplitWin && <SummaryItem label={t("Number of winners")} value={form.numWinners} />}
              {isSplitWin && <SummaryItem label={t("Actions to claim a slot")} value={form.threshold} />}
              {isSplitWin && stakeAmountWei > 0n && numWinnersValue > 0 && (
                <SummaryItem label={t("Prize per winner")} value={`${formatWei(splitWinPrizePerWinner)} B3TR`} />
              )}
              <SummaryItem label={t("Title (optional)")} value={form.title || t("Skip")} />
              <SummaryItem label={t(amountLabelKey)} value={`${form.stakeAmount} B3TR`} />
              <SummaryItem label={t("Start round")} value={form.startRound} />
              <SummaryItem label={t("Duration")} value={`${duration} ${duration === 1 ? t("round") : t("rounds")}`} />
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

interface SplitWinControlsProps {
  flow: CreateChallengeFlow
  t: TFunction
}

const NumWinnersControls = ({ flow, t }: SplitWinControlsProps) => {
  const [touched, setTouched] = useState(false)
  const invalid = touched && flow.hasInvalidNumWinners
  const invalidPrize = touched && flow.hasInsufficientPrizePerWinner
  const markTouched = () => setTouched(true)

  return (
    <VStack align="stretch" gap="3">
      <HStack gap="2" flexWrap="wrap">
        {QUICK_NUM_WINNERS.map(value => (
          <Button
            key={value}
            size="sm"
            variant={getChoiceVariant(flow.form.numWinners === value)}
            onClick={() => {
              markTouched()
              flow.updateNumWinners(value)
            }}>
            {value}
          </Button>
        ))}
      </HStack>
      <Field.Root invalid={invalid || invalidPrize}>
        <Input
          type="number"
          min="1"
          step="1"
          value={flow.form.numWinners}
          onChange={e => {
            markTouched()
            flow.updateNumWinners(e.target.value)
          }}
        />
        {invalid && <Field.ErrorText>{t("Number of winners must be greater than 0")}</Field.ErrorText>}
        {invalidPrize && (
          <Field.ErrorText>{t("Each winner must receive at least {{min}} B3TR", { min: "1" })}</Field.ErrorText>
        )}
      </Field.Root>
      {flow.stakeAmountWei > 0n && flow.numWinnersValue > 0 && (
        <Text textStyle="xs" color="text.subtle">
          {t("Prize per winner")}
          {": "}
          {formatWei(flow.splitWinPrizePerWinner)} {"B3TR"}
        </Text>
      )}
      <HStack justify="flex-end">
        <Button
          size="sm"
          variant={primaryVariant}
          disabled={flow.hasInvalidNumWinners || flow.hasInsufficientPrizePerWinner}
          onClick={flow.confirmSplitWinNumWinners}>
          {t("Continue")}
        </Button>
      </HStack>
    </VStack>
  )
}

const ThresholdControls = ({ flow, t }: SplitWinControlsProps) => {
  const [touched, setTouched] = useState(false)
  const invalidLow = touched && flow.thresholdValue <= 0
  const invalidHigh = touched && flow.thresholdValue > MAX_THRESHOLD
  const markTouched = () => setTouched(true)

  return (
    <VStack align="stretch" gap="3">
      <HStack gap="2" flexWrap="wrap">
        {QUICK_THRESHOLDS.map(value => (
          <Button
            key={value}
            size="sm"
            variant={getChoiceVariant(flow.form.threshold === value)}
            onClick={() => {
              markTouched()
              flow.updateThreshold(value)
            }}>
            {value}
          </Button>
        ))}
      </HStack>
      <Field.Root invalid={invalidLow || invalidHigh}>
        <Input
          type="number"
          min="1"
          max={MAX_THRESHOLD}
          step="1"
          value={flow.form.threshold}
          onChange={e => {
            markTouched()
            flow.updateThreshold(e.target.value)
          }}
        />
        {invalidLow && <Field.ErrorText>{t("Actions per winner must be greater than 0")}</Field.ErrorText>}
        {invalidHigh && <Field.ErrorText>{t("Maximum actions is {{max}}", { max: MAX_THRESHOLD })}</Field.ErrorText>}
      </Field.Root>
      <HStack justify="flex-end">
        <Button
          size="sm"
          variant={primaryVariant}
          disabled={flow.hasInvalidThreshold}
          onClick={flow.confirmSplitWinThreshold}>
          {t("Continue")}
        </Button>
      </HStack>
    </VStack>
  )
}

interface InviteeRowProps {
  value: string
  error: InviteeValidationError | null
  onChange: (value: string) => void
  onRemove: () => void
  t: TFunction
}

const InviteeRow = ({ value, error, onChange, onRemove, t }: InviteeRowProps) => {
  const [touched, setTouched] = useState(false)
  const visibleError = touched ? error : null

  return (
    <VStack align="stretch" gap="1">
      <HStack gap="2">
        <Input
          placeholder={t("0x... or name.vet")}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          borderColor={visibleError ? "border.error" : undefined}
        />
        <IconButton size="sm" variant="ghost" onClick={onRemove} aria-label={t("Remove")}>
          <LuX />
        </IconButton>
      </HStack>
      {visibleError && (
        <Text textStyle="xs" color="fg.error">
          {getInviteeValidationMessage(t, visibleError)}
        </Text>
      )}
    </VStack>
  )
}

import {
  Button,
  Field,
  Grid,
  GridItem,
  HStack,
  Icon,
  Input,
  NativeSelect,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { UilPlus, UilTrash } from "@iconscout/react-unicons"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  EvidenceLink,
  ExpenditureLineItem,
  ExpenditureReport,
  GrantProposalEnriched,
} from "@/hooks/proposals/grants/types"

type FormErrors = {
  milestoneGoal?: string
  milestoneAchievedExplanation?: string
  evidenceLinks?: string
  evidenceLinkUrls?: Record<number, string>
  expenditureItems?: string
  totalReceived?: string
  submit?: string
}

const MAX_NOTES_LENGTH = 1500
const EVIDENCE_TYPES = ["GitHub", "Demo", "Dashboard", "Audit Report", "Other"] as const

const isValidEvidenceUrl = (url: string): boolean => {
  try {
    const u = new URL(url)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

interface ExpenditureReportFormProps {
  proposal: GrantProposalEnriched
  currentMilestoneIndex: number
  totalMilestones: number
  onSubmit: (report: ExpenditureReport) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  /** When present, the form opens in "Update" mode and is prefilled with this report's values. */
  existingReport?: ExpenditureReport
}

export const ExpenditureReportForm = ({
  proposal,
  currentMilestoneIndex,
  totalMilestones,
  onSubmit,
  onCancel,
  isSubmitting,
  existingReport,
}: ExpenditureReportFormProps) => {
  const { t } = useTranslation()

  const [milestoneGoal, setMilestoneGoal] = useState(existingReport?.milestoneGoal ?? "")
  const [milestoneAchieved, setMilestoneAchieved] = useState<"yes" | "no" | "partially">(
    existingReport?.milestoneAchieved ?? "yes",
  )
  const [milestoneAchievedExplanation, setMilestoneAchievedExplanation] = useState(
    existingReport?.milestoneAchievedExplanation ?? "",
  )
  const [evidenceLinks, setEvidenceLinks] = useState<EvidenceLink[]>(
    existingReport?.evidenceLinks?.length ? existingReport.evidenceLinks : [{ url: "", type: "GitHub", label: "" }],
  )
  const [expenditureItems, setExpenditureItems] = useState<ExpenditureLineItem[]>(
    existingReport?.expenditureItems?.length
      ? existingReport.expenditureItems
      : [{ category: "", description: "", amount: 0 }],
  )
  const [totalReceived, setTotalReceived] = useState(existingReport?.totalReceivedForTranche ?? 0)
  const [notes, setNotes] = useState(existingReport?.notes ?? "")
  const [errors, setErrors] = useState<FormErrors>({})

  /**
   * Auto-fill "Total received for this tranche" from the milestone's on-chain B3TR amount × current
   * B3TR/USD price. Only runs once at mount when there's no existing report — the user can still
   * override the value, and we never overwrite an Update flow.
   */
  const { data: b3trUsdPrice } = useGetTokenUsdPrice("B3TR")
  const milestoneB3trAmount = proposal.milestones?.[currentMilestoneIndex]?.fundingAmount ?? 0
  const autoFilledRef = useRef(!!existingReport)
  useEffect(() => {
    if (autoFilledRef.current) return
    if (!b3trUsdPrice || !milestoneB3trAmount) return
    autoFilledRef.current = true
    setTotalReceived(Math.round(milestoneB3trAmount * Number(b3trUsdPrice)))
  }, [b3trUsdPrice, milestoneB3trAmount])

  const totalSpent = expenditureItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0)
  const unspentAmount = totalReceived - totalSpent

  const handleAddEvidence = () => {
    setEvidenceLinks([...evidenceLinks, { url: "", type: "GitHub", label: "" }])
  }

  const handleRemoveEvidence = (index: number) => {
    setEvidenceLinks(evidenceLinks.filter((_, i) => i !== index))
  }

  const updateEvidence = (index: number, field: keyof EvidenceLink, value: string) => {
    const updated: EvidenceLink[] = [...evidenceLinks]
    updated[index] = { ...updated[index], [field]: value } as EvidenceLink
    setEvidenceLinks(updated)
  }

  const handleAddExpenditure = () => {
    setExpenditureItems([...expenditureItems, { category: "", description: "", amount: 0 }])
  }

  const handleRemoveExpenditure = (index: number) => {
    setExpenditureItems(expenditureItems.filter((_, i) => i !== index))
  }

  const updateExpenditure = (index: number, field: keyof ExpenditureLineItem, value: string | number) => {
    const updated: ExpenditureLineItem[] = [...expenditureItems]
    updated[index] = { ...updated[index], [field]: value } as ExpenditureLineItem
    setExpenditureItems(updated)
  }

  const handleSubmit = useCallback(async () => {
    const nextErrors: FormErrors = {}

    if (!milestoneGoal.trim()) nextErrors.milestoneGoal = t("Please describe the milestone goal")

    if (milestoneAchieved !== "yes" && !milestoneAchievedExplanation.trim()) {
      nextErrors.milestoneAchievedExplanation = t("Please explain the milestone status")
    }

    const filledLinks = evidenceLinks.filter(link => link.url.trim())
    if (filledLinks.length === 0) {
      nextErrors.evidenceLinks = t("Please add at least one evidence link")
    } else {
      const urlErrors: Record<number, string> = {}
      evidenceLinks.forEach((link, i) => {
        if (link.url.trim() && !isValidEvidenceUrl(link.url)) {
          urlErrors[i] = t("Please enter a valid URL starting with http:// or https://")
        }
      })
      if (Object.keys(urlErrors).length > 0) nextErrors.evidenceLinkUrls = urlErrors
    }

    const validItems = expenditureItems.filter(item => item.category.trim() && item.amount > 0)
    if (validItems.length === 0) {
      nextErrors.expenditureItems = t("Please add at least one expenditure item (category + amount)")
    }

    if (totalReceived <= 0) {
      nextErrors.totalReceived = t("Please specify the total amount received")
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const report: ExpenditureReport = {
      projectName: proposal.projectName,
      grantRecipient: proposal.grantsReceiverAddress,
      trancheNumber: currentMilestoneIndex + 1,
      totalTranches: totalMilestones,
      dateSubmitted: Math.floor(Date.now() / 1000),
      milestoneGoal,
      milestoneAchieved,
      milestoneAchievedExplanation: milestoneAchieved !== "yes" ? milestoneAchievedExplanation : undefined,
      evidenceLinks: filledLinks,
      expenditureItems: validItems,
      totalSpent,
      totalReceivedForTranche: totalReceived,
      unspentAmount,
      notes,
    }

    try {
      await onSubmit(report)
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : t("Failed to submit milestone report") })
    }
  }, [
    milestoneGoal,
    milestoneAchieved,
    milestoneAchievedExplanation,
    evidenceLinks,
    expenditureItems,
    totalSpent,
    totalReceived,
    unspentAmount,
    notes,
    proposal,
    currentMilestoneIndex,
    totalMilestones,
    onSubmit,
    t,
  ])

  return (
    <VStack align="stretch" gap={6} w="full">
      <VStack align="flex-start" gap={1}>
        <Text textStyle="lg" fontWeight="semibold">
          {t("Milestone {{milestone}} Report", { milestone: currentMilestoneIndex + 1 })}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {proposal.projectName}
        </Text>
      </VStack>

      {/* Milestone Completion Summary */}
      <VStack align="flex-start" gap={4} p={4} borderWidth="1px" borderRadius="xl" borderColor="border.primary">
        <Text textStyle="md" fontWeight="semibold">
          {t("Milestone completion summary")}
        </Text>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="full">
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Field.Root invalid={!!errors.milestoneGoal}>
              <Field.Label textStyle="sm" color="text.default">
                {t("Milestone goal")}
              </Field.Label>
              <Textarea
                placeholder={t("Brief description of the objective for this tranche")}
                value={milestoneGoal}
                onChange={e => {
                  setMilestoneGoal(e.target.value)
                  if (errors.milestoneGoal) setErrors(prev => ({ ...prev, milestoneGoal: undefined }))
                }}
                borderRadius="xl"
                minH="80px"
                resize="vertical"
              />
              {errors.milestoneGoal && <Field.ErrorText>{errors.milestoneGoal}</Field.ErrorText>}
            </Field.Root>
          </GridItem>
          <GridItem>
            <Field.Root>
              <Field.Label textStyle="sm" color="text.default">
                {t("Was this milestone achieved?")}
              </Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={milestoneAchieved}
                  onChange={e => setMilestoneAchieved(e.target.value as "yes" | "no" | "partially")}>
                  <option value="yes">{t("Yes")}</option>
                  <option value="no">{t("No")}</option>
                  <option value="partially">{t("Partially")}</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
          </GridItem>
          {milestoneAchieved !== "yes" && (
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Field.Root invalid={!!errors.milestoneAchievedExplanation}>
                <Field.Label textStyle="sm" color="text.default">
                  {t("Explanation")}
                </Field.Label>
                <Textarea
                  placeholder={t("Explain the current status")}
                  value={milestoneAchievedExplanation}
                  onChange={e => {
                    setMilestoneAchievedExplanation(e.target.value)
                    if (errors.milestoneAchievedExplanation)
                      setErrors(prev => ({ ...prev, milestoneAchievedExplanation: undefined }))
                  }}
                  borderRadius="xl"
                  minH="60px"
                  resize="vertical"
                />
                {errors.milestoneAchievedExplanation && (
                  <Field.ErrorText>{errors.milestoneAchievedExplanation}</Field.ErrorText>
                )}
              </Field.Root>
            </GridItem>
          )}
        </Grid>
      </VStack>

      {/* Evidence of Completion */}
      <VStack align="flex-start" gap={4} p={4} borderWidth="1px" borderRadius="xl" borderColor="border.primary">
        <Text textStyle="md" fontWeight="semibold">
          {t("Evidence of completion")}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {t("Provide links to GitHub commits, product demos, dashboards, audit reports, etc.")}
        </Text>
        {evidenceLinks.map((link, index) => (
          <Grid key={index} templateColumns={{ base: "1fr", md: "1fr 1fr 1fr auto" }} gap={3} w="full">
            <GridItem>
              <Field.Root>
                <Field.Label textStyle="sm" color="text.default">
                  {t("Type")}
                </Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field value={link.type} onChange={e => updateEvidence(index, "type", e.target.value)}>
                    {EVIDENCE_TYPES.map(type => (
                      <option key={type} value={type}>
                        {t(type)}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
            </GridItem>
            <GridItem>
              <Field.Root>
                <Field.Label textStyle="sm" color="text.default">
                  {t("Label")}
                </Field.Label>
                <Input
                  placeholder={t("e.g. Smart contract repo")}
                  value={link.label}
                  onChange={e => updateEvidence(index, "label", e.target.value)}
                  borderRadius="xl"
                />
              </Field.Root>
            </GridItem>
            <GridItem>
              <Field.Root invalid={!!errors.evidenceLinkUrls?.[index]}>
                <Field.Label textStyle="sm" color="text.default">
                  {t("URL")}
                </Field.Label>
                <Input
                  placeholder="https://..."
                  value={link.url}
                  onChange={e => {
                    updateEvidence(index, "url", e.target.value)
                    if (errors.evidenceLinkUrls?.[index] || errors.evidenceLinks) {
                      setErrors(prev => {
                        const next = { ...prev }
                        if (next.evidenceLinkUrls) {
                          const copy = { ...next.evidenceLinkUrls }
                          delete copy[index]
                          next.evidenceLinkUrls = Object.keys(copy).length > 0 ? copy : undefined
                        }
                        next.evidenceLinks = undefined
                        return next
                      })
                    }
                  }}
                  borderRadius="xl"
                />
                {errors.evidenceLinkUrls?.[index] && (
                  <Field.ErrorText>{errors.evidenceLinkUrls[index]}</Field.ErrorText>
                )}
              </Field.Root>
            </GridItem>
            {evidenceLinks.length > 1 && (
              <GridItem display="flex" alignItems="flex-end">
                <Button variant="ghost" size="sm" onClick={() => handleRemoveEvidence(index)}>
                  <Icon as={UilTrash} />
                </Button>
              </GridItem>
            )}
          </Grid>
        ))}
        <Button variant="link" onClick={handleAddEvidence}>
          <Icon as={UilPlus} />
          {t("Add evidence link")}
        </Button>
        {errors.evidenceLinks && (
          <Text textStyle="sm" color="status.negative.strong">
            {errors.evidenceLinks}
          </Text>
        )}
      </VStack>

      {/* Expenditure Breakdown */}
      <VStack align="flex-start" gap={4} p={4} borderWidth="1px" borderRadius="xl" borderColor="border.primary">
        <Text textStyle="md" fontWeight="semibold">
          {t("Expenditure breakdown")}
        </Text>
        {expenditureItems.map((item, index) => (
          <Grid key={index} templateColumns={{ base: "1fr", md: "1fr 1fr auto auto" }} gap={3} w="full">
            <GridItem>
              <Field.Root>
                <Field.Label textStyle="sm" color="text.default">
                  {t("Category")}
                </Field.Label>
                <Input
                  placeholder={t("e.g. Development, Marketing")}
                  value={item.category}
                  onChange={e => updateExpenditure(index, "category", e.target.value)}
                  borderRadius="xl"
                />
              </Field.Root>
            </GridItem>
            <GridItem>
              <Field.Root>
                <Field.Label textStyle="sm" color="text.default">
                  {t("Description")}
                </Field.Label>
                <Input
                  placeholder={t("e.g. Smart contract work")}
                  value={item.description}
                  onChange={e => updateExpenditure(index, "description", e.target.value)}
                  borderRadius="xl"
                />
              </Field.Root>
            </GridItem>
            <GridItem>
              <Field.Root>
                <Field.Label textStyle="sm" color="text.default">
                  {t("Amount (USD)")}
                </Field.Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="0"
                  value={item.amount || ""}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/\D/g, "")
                    updateExpenditure(index, "amount", cleaned === "" ? 0 : Number(cleaned))
                  }}
                  borderRadius="xl"
                />
              </Field.Root>
            </GridItem>
            {expenditureItems.length > 1 && (
              <GridItem display="flex" alignItems="flex-end">
                <Button variant="ghost" size="sm" onClick={() => handleRemoveExpenditure(index)}>
                  <Icon as={UilTrash} />
                </Button>
              </GridItem>
            )}
          </Grid>
        ))}
        <Button variant="link" onClick={handleAddExpenditure}>
          <Icon as={UilPlus} />
          {t("Add expenditure item")}
        </Button>
        {errors.expenditureItems && (
          <Text textStyle="sm" color="status.negative.strong">
            {errors.expenditureItems}
          </Text>
        )}
      </VStack>

      {/* Unspent Funds Summary */}
      <VStack align="flex-start" gap={4} p={4} borderWidth="1px" borderRadius="xl" borderColor="border.primary">
        <Text textStyle="md" fontWeight="semibold">
          {t("Unspent funds summary")}
        </Text>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4} w="full">
          <GridItem>
            <Field.Root invalid={!!errors.totalReceived}>
              <Field.Label textStyle="sm" color="text.default">
                {t("Total received for this tranche (USD)")}
              </Field.Label>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="0"
                value={totalReceived || ""}
                onChange={e => {
                  const cleaned = e.target.value.replace(/\D/g, "")
                  setTotalReceived(cleaned === "" ? 0 : Number(cleaned))
                  if (errors.totalReceived) setErrors(prev => ({ ...prev, totalReceived: undefined }))
                }}
                borderRadius="xl"
              />
              {milestoneB3trAmount > 0 && (
                <Field.HelperText textStyle="xs" color="text.subtle">
                  {t("Auto-filled from {{b3tr}} B3TR at the current B3TR/USD rate. Edit if needed.", {
                    b3tr: milestoneB3trAmount.toLocaleString(),
                  })}
                </Field.HelperText>
              )}
              {errors.totalReceived && <Field.ErrorText>{errors.totalReceived}</Field.ErrorText>}
            </Field.Root>
          </GridItem>
          <GridItem>
            <VStack align="stretch" gap={1}>
              <Text textStyle="sm" fontWeight="semibold">
                {t("Total spent")}
              </Text>
              <Text textStyle="md">
                {"$"}
                {totalSpent.toLocaleString()}
              </Text>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack align="stretch" gap={1}>
              <Text textStyle="sm" fontWeight="semibold">
                {t("Unspent amount")}
              </Text>
              <Text textStyle="md" color={unspentAmount < 0 ? "status.negative.strong" : "text.default"}>
                {"$"}
                {unspentAmount.toLocaleString()}
              </Text>
            </VStack>
          </GridItem>
        </Grid>
      </VStack>

      {/* Notes */}
      <VStack align="flex-start" gap={2}>
        <Text textStyle="md" fontWeight="semibold">
          {t("Notes or challenges faced")}
        </Text>
        <Textarea
          placeholder={t("Share blockers, learnings, or changes")}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          maxLength={MAX_NOTES_LENGTH}
          borderRadius="xl"
          minH="100px"
          resize="vertical"
        />
        <HStack w="full" justify="flex-end">
          <Text textStyle="xs" color="text.subtle">
            {notes.length}
            {"/"}
            {MAX_NOTES_LENGTH}
          </Text>
        </HStack>
      </VStack>

      {errors.submit && (
        <Text textStyle="sm" color="status.negative.strong">
          {errors.submit}
        </Text>
      )}

      {/* Actions */}
      <Grid templateColumns={{ base: "1fr", md: "auto auto" }} gap={4} justifyContent="flex-start">
        <Button variant="secondary" onClick={onCancel}>
          {t("Cancel")}
        </Button>
        <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
          {t("Submit report")}
        </Button>
      </Grid>
    </VStack>
  )
}

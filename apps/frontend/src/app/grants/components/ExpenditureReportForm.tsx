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
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { toaster } from "@/components/ui/toaster"
import {
  EvidenceLink,
  ExpenditureLineItem,
  ExpenditureReport,
  GrantProposalEnriched,
} from "@/hooks/proposals/grants/types"

const MAX_NOTES_LENGTH = 1500
const EVIDENCE_TYPES = ["GitHub", "Demo", "Dashboard", "Audit Report", "Other"]

interface ExpenditureReportFormProps {
  proposal: GrantProposalEnriched
  currentMilestoneIndex: number
  totalMilestones: number
  onSubmit: (report: ExpenditureReport) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export const ExpenditureReportForm = ({
  proposal,
  currentMilestoneIndex,
  totalMilestones,
  onSubmit,
  onCancel,
  isSubmitting,
}: ExpenditureReportFormProps) => {
  const { t } = useTranslation()

  const [milestoneGoal, setMilestoneGoal] = useState("")
  const [milestoneAchieved, setMilestoneAchieved] = useState<"yes" | "no" | "partially">("yes")
  const [milestoneAchievedExplanation, setMilestoneAchievedExplanation] = useState("")
  const [evidenceLinks, setEvidenceLinks] = useState<EvidenceLink[]>([{ url: "", type: "GitHub", label: "" }])
  const [expenditureItems, setExpenditureItems] = useState<ExpenditureLineItem[]>([
    { category: "", description: "", amount: 0 },
  ])
  const [totalReceived, setTotalReceived] = useState(0)
  const [notes, setNotes] = useState("")

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
    // Validate required fields
    if (!milestoneGoal.trim()) {
      toaster.create({ description: t("Please describe the milestone goal"), type: "error", closable: true })
      return
    }

    const validLinks = evidenceLinks.filter(link => link.url.trim())
    if (validLinks.length === 0) {
      toaster.create({ description: t("Please add at least one evidence link"), type: "error", closable: true })
      return
    }

    const validItems = expenditureItems.filter(item => item.category.trim() && item.amount > 0)
    if (validItems.length === 0) {
      toaster.create({
        description: t("Please add at least one expenditure item"),
        type: "error",
        closable: true,
      })
      return
    }

    const report: ExpenditureReport = {
      projectName: proposal.projectName,
      grantRecipient: proposal.grantsReceiverAddress,
      trancheNumber: currentMilestoneIndex + 1,
      totalTranches: totalMilestones,
      dateSubmitted: Math.floor(Date.now() / 1000),
      milestoneGoal,
      milestoneAchieved,
      milestoneAchievedExplanation: milestoneAchieved !== "yes" ? milestoneAchievedExplanation : undefined,
      evidenceLinks: validLinks,
      expenditureItems: validItems,
      totalSpent,
      totalReceivedForTranche: totalReceived,
      unspentAmount,
      notes,
    }

    await onSubmit(report)
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
          {t("Grant Expenditure Report")}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {t("Tranche {{current}} of {{total}} - {{project}}", {
            current: currentMilestoneIndex + 1,
            total: totalMilestones,
            project: proposal.projectName,
          })}
        </Text>
      </VStack>

      {/* Milestone Completion Summary */}
      <VStack align="flex-start" gap={4} p={4} borderWidth="1px" borderRadius="xl" borderColor="border.primary">
        <Text textStyle="md" fontWeight="semibold">
          {t("Milestone completion summary")}
        </Text>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="full">
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Field.Root>
              <Field.Label textStyle="sm" color="text.default">
                {t("Milestone goal")}
              </Field.Label>
              <Textarea
                placeholder={t("Brief description of the objective for this tranche")}
                value={milestoneGoal}
                onChange={e => setMilestoneGoal(e.target.value)}
                borderRadius="xl"
                minH="80px"
                resize="vertical"
              />
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
              <Field.Root>
                <Field.Label textStyle="sm" color="text.default">
                  {t("Explanation")}
                </Field.Label>
                <Textarea
                  placeholder={t("Explain the current status")}
                  value={milestoneAchievedExplanation}
                  onChange={e => setMilestoneAchievedExplanation(e.target.value)}
                  borderRadius="xl"
                  minH="60px"
                  resize="vertical"
                />
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
                        {type}
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
              <Field.Root>
                <Field.Label textStyle="sm" color="text.default">
                  {t("URL")}
                </Field.Label>
                <Input
                  placeholder="https://..."
                  value={link.url}
                  onChange={e => updateEvidence(index, "url", e.target.value)}
                  borderRadius="xl"
                />
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
                  placeholder="0"
                  value={item.amount || ""}
                  onChange={e => updateExpenditure(index, "amount", Number(e.target.value))}
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
      </VStack>

      {/* Unspent Funds Summary */}
      <VStack align="flex-start" gap={4} p={4} borderWidth="1px" borderRadius="xl" borderColor="border.primary">
        <Text textStyle="md" fontWeight="semibold">
          {t("Unspent funds summary")}
        </Text>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4} w="full">
          <GridItem>
            <Field.Root>
              <Field.Label textStyle="sm" color="text.default">
                {t("Total received for this tranche (USD)")}
              </Field.Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={totalReceived || ""}
                onChange={e => setTotalReceived(Number(e.target.value))}
                borderRadius="xl"
              />
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

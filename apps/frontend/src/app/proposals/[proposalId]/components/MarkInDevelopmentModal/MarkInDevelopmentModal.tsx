import { Alert, Box, Button, Field, HStack, Heading, IconButton, Input, Stack, Text, VStack } from "@chakra-ui/react"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import { ethers, isAddress } from "ethers"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { MdAdd, MdClose } from "react-icons/md"

import { BaseModal } from "@/components/BaseModal"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { useMarkProposalInDevelopment } from "@/hooks/useMarkProposalInDevelopment"
import { useUpdateCommunityExecution } from "@/hooks/useUpdateCommunityExecution"

type Props = {
  proposalId: string
  /** Max B3TR budget the proposal was voted on (bigint wei). */
  maxBudget: bigint
  isOpen: boolean
  onClose: () => void
  /** Initial values when editing an already-finalized proposal (only allowed before payout). */
  initialValues?: {
    payee?: string
    description?: string
    implementationDiscussion?: string
    contributors?: readonly string[]
  }
  /** If true, the modal calls updateCommunityExecution instead of markAsInDevelopment. */
  isEdit?: boolean
}

const trimAll = (s: string) => s.trim()

export const MarkInDevelopmentModal = ({ proposalId, maxBudget, isOpen, onClose, initialValues, isEdit }: Props) => {
  const { t } = useTranslation()
  const { data: b3trUsdPrice } = useGetTokenUsdPrice("B3TR")

  const [payee, setPayee] = useState(initialValues?.payee ?? "")
  const [description, setDescription] = useState(initialValues?.description ?? "")
  const [implementationDiscussion, setImplementationDiscussion] = useState(
    initialValues?.implementationDiscussion ?? "",
  )
  const [contributors, setContributors] = useState<string[]>(
    initialValues?.contributors ? [...initialValues.contributors] : [],
  )
  const [submitting, setSubmitting] = useState(false)

  // When initialValues change (loading from chain), seed the form once.
  useEffect(() => {
    if (!initialValues) return
    setPayee(initialValues.payee ?? "")
    setDescription(initialValues.description ?? "")
    setImplementationDiscussion(initialValues.implementationDiscussion ?? "")
    setContributors(initialValues.contributors ? [...initialValues.contributors] : [])
  }, [initialValues])

  const txUI = {
    waitingConfirmation: {
      title: t(isEdit ? "Updating implementation details..." : "Registering implementation details..."),
    },
    success: { title: t(isEdit ? "Implementation details updated" : "Proposal moved to In Development") },
    error: {
      title: t(isEdit ? "Failed to update implementation details" : "Failed to register implementation details"),
    },
  }
  const onTxSuccess = () => {
    onClose()
    setSubmitting(false)
  }
  const markMutation = useMarkProposalInDevelopment({
    proposalId,
    transactionModalCustomUI: txUI,
    onSuccess: onTxSuccess,
  })
  const updateMutation = useUpdateCommunityExecution({
    proposalId,
    transactionModalCustomUI: txUI,
    onSuccess: onTxSuccess,
  })

  const hasBudget = maxBudget > 0n
  const budgetEther = useMemo(() => Number(ethers.formatEther(maxBudget)), [maxBudget])
  const budgetUsd = useMemo(() => {
    const price = Number(b3trUsdPrice)
    if (!Number.isFinite(price) || price <= 0 || !hasBudget) return undefined
    return budgetEther * price
  }, [budgetEther, b3trUsdPrice, hasBudget])

  const trimmedPayee = payee.trim()
  const trimmedDescription = description.trim()
  const trimmedDiscussion = implementationDiscussion.trim()
  const cleanedContributors = useMemo(() => contributors.map(trimAll).filter(c => c.length > 0), [contributors])

  const payeeValid = hasBudget ? isAddress(trimmedPayee) : true
  const overContributorLimit = cleanedContributors.length > 20

  const canSubmit =
    !submitting && trimmedDescription.length > 0 && trimmedDiscussion.length > 0 && payeeValid && !overContributorLimit

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return
    setSubmitting(true)
    const payload = {
      payee: hasBudget ? trimmedPayee : ethers.ZeroAddress,
      description: trimmedDescription,
      implementationDiscussion: trimmedDiscussion,
      contributors: cleanedContributors,
    }
    if (isEdit) {
      updateMutation.sendTransaction(payload)
    } else {
      markMutation.sendTransaction(payload)
    }
  }, [
    canSubmit,
    cleanedContributors,
    hasBudget,
    isEdit,
    markMutation,
    trimmedDescription,
    trimmedDiscussion,
    trimmedPayee,
    updateMutation,
  ])

  const addContributor = () => setContributors(prev => [...prev, ""])
  const updateContributor = (idx: number, value: string) =>
    setContributors(prev => prev.map((c, i) => (i === idx ? value : c)))
  const removeContributor = (idx: number) => setContributors(prev => prev.filter((_, i) => i !== idx))

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={t(isEdit ? "Edit implementation details" : "Register implementation details")}
      showCloseButton
      isCloseable>
      <VStack w="full" align="stretch" gap={6}>
        <Heading size="lg">{t(isEdit ? "Edit implementation details" : "Register implementation details")}</Heading>
        <Text textStyle="sm" color="gray.500">
          {t(
            "The implementation cost approved by voters will be paid out to a single payout address you choose below. That wallet is responsible for forwarding funds to the actual contributors — developers, project managers, designers, etc. — off chain. You can edit these details up until the payout is claimed.",
          )}
        </Text>

        {hasBudget && (
          <Box bg="b3tr-balance-bg" p={4} borderRadius="md">
            <Text textStyle="sm" color="gray.500">
              {t("Implementation cost (paid in full to the payout address):")}
            </Text>
            <HStack gap={3} align="center" mt={1}>
              <B3TRIcon boxSize={6} colorVariant="dark" />
              <Heading size={["md", "lg"]}>
                {`${budgetEther.toLocaleString(undefined, { maximumFractionDigits: 4 })} B3TR`}
              </Heading>
              {budgetUsd !== undefined && (
                <Text textStyle="md" color="gray.500">
                  {`≈ $${budgetUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                </Text>
              )}
            </HStack>
          </Box>
        )}

        {hasBudget && (
          <Field.Root invalid={trimmedPayee.length > 0 && !payeeValid}>
            <Field.Label>{t("Payout address")}</Field.Label>
            <Input
              data-testid="payee-address-input"
              value={payee}
              onChange={e => setPayee(e.target.value)}
              placeholder="0x..."
            />
            {trimmedPayee.length > 0 && !payeeValid ? (
              <Field.ErrorText>{t("Invalid address")}</Field.ErrorText>
            ) : (
              <Field.HelperText fontStyle="sm" color="gray.500">
                {t(
                  "This wallet receives the full implementation cost in one transfer. Make sure it is a wallet you control or trust — it is responsible for distributing funds to the rest of the team.",
                )}
              </Field.HelperText>
            )}
          </Field.Root>
        )}

        <Field.Root>
          <Field.Label>{t("Description")}</Field.Label>
          <Input
            data-testid="dev-description-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t("e.g. Developed by Framer and Rosa, with PM support from Alice")}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>{t("Implementation discussion")}</Field.Label>
          <Input
            data-testid="implementation-discussion-input"
            value={implementationDiscussion}
            onChange={e => setImplementationDiscussion(e.target.value)}
            placeholder="https://vechain.discourse.group/..."
          />
          <Field.HelperText fontStyle="sm" color="gray.500">
            {t(
              "Link to the Discourse / forum thread where the implementation, budget and team selection were discussed.",
            )}
          </Field.HelperText>
        </Field.Root>

        <VStack align="stretch" gap={3}>
          <Text fontWeight="semibold">{t("Contributors")}</Text>
          <Text textStyle="sm" color="gray.500">
            {t(
              "Optional. Add GitHub or X (Twitter) profile URLs of everyone who is contributing to the implementation. These are shown publicly as an avatar row on the proposal page.",
            )}
          </Text>
          {contributors.map((c, idx) => (
            <Stack key={idx} direction={["column", "row"]} gap={2} align={["stretch", "center"]}>
              <Input
                data-testid={`contributor-input-${idx}`}
                value={c}
                onChange={e => updateContributor(idx, e.target.value)}
                placeholder="https://github.com/alice or https://x.com/bob"
                flex={1}
              />
              <IconButton aria-label={t("Remove contributor")} variant="ghost" onClick={() => removeContributor(idx)}>
                <MdClose />
              </IconButton>
            </Stack>
          ))}
          <Button variant="outline" size="sm" onClick={addContributor} disabled={cleanedContributors.length >= 20}>
            <MdAdd />
            {t("Add contributor")}
          </Button>
          {overContributorLimit && (
            <Alert.Root status="error" borderRadius="md">
              <Alert.Indicator />
              <Alert.Title>{t("Too many contributors — please keep the list at 20 or fewer.")}</Alert.Title>
            </Alert.Root>
          )}
        </VStack>

        <Button
          variant="primary"
          alignSelf="flex-end"
          disabled={!canSubmit}
          onClick={handleSubmit}
          data-testid="mark-in-development-submit">
          {t(isEdit ? "Save changes" : "Mark as In Development")}
        </Button>
      </VStack>
    </BaseModal>
  )
}

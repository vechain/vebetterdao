import { Box, Button, Field, HStack, Heading, IconButton, Input, Stack, Text, VStack } from "@chakra-ui/react"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import { ethers, isAddress } from "ethers"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { MdAdd, MdClose } from "react-icons/md"

import { BaseModal } from "@/components/BaseModal"
import { MarkInDevelopmentPayee, useMarkProposalInDevelopment } from "@/hooks/useMarkProposalInDevelopment"

type Props = {
  proposalId: string
  /** Max B3TR budget the proposal was voted on (bigint wei). */
  maxBudget: bigint
  isOpen: boolean
  onClose: () => void
}

type PayeeRow = { address: string; amount: string }

const emptyRow = (): PayeeRow => ({ address: "", amount: "" })

const parseAmountToWei = (amount: string): bigint | null => {
  if (!amount || amount.trim() === "") return null
  try {
    return ethers.parseEther(amount.trim())
  } catch {
    return null
  }
}

export const MarkInDevelopmentModal = ({ proposalId, maxBudget, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { data: b3trUsdPrice } = useGetTokenUsdPrice("B3TR")
  const [devNickname, setDevNickname] = useState("")
  const [discussionLink, setDiscussionLink] = useState("")
  const [rows, setRows] = useState<PayeeRow[]>([emptyRow()])
  const [submitting, setSubmitting] = useState(false)

  const mutation = useMarkProposalInDevelopment({
    proposalId,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Registering developers...") },
      success: { title: t("Proposal moved to In Development") },
      error: { title: t("Failed to register developers") },
    },
    onSuccess: () => {
      onClose()
      setRows([emptyRow()])
      setDevNickname("")
      setDiscussionLink("")
      setSubmitting(false)
    },
  })

  const parsedPayees = useMemo<MarkInDevelopmentPayee[]>(() => {
    const out: MarkInDevelopmentPayee[] = []
    for (const row of rows) {
      const wei = parseAmountToWei(row.amount)
      if (!wei || wei <= 0n) continue
      if (!isAddress(row.address)) continue
      out.push({ account: row.address, amount: wei })
    }
    return out
  }, [rows])

  const sumWei = useMemo(() => parsedPayees.reduce((acc, p) => acc + p.amount, 0n), [parsedPayees])
  const sumEther = useMemo(() => Number(ethers.formatEther(sumWei)), [sumWei])
  const budgetEther = useMemo(() => Number(ethers.formatEther(maxBudget)), [maxBudget])
  const sumUsd = useMemo(() => {
    const price = Number(b3trUsdPrice)
    if (!Number.isFinite(price) || price <= 0) return undefined
    return sumEther * price
  }, [sumEther, b3trUsdPrice])

  const hasBudget = maxBudget > 0n
  const overBudget = hasBudget && sumWei > maxBudget
  // When budget == 0 the proposal has no payout flow — payees field is hidden and we just collect
  // nickname + discussion link for transparency. When budget > 0, full validation kicks in.
  const canSubmit =
    !submitting &&
    devNickname.trim().length > 0 &&
    discussionLink.trim().length > 0 &&
    (hasBudget ? parsedPayees.length > 0 && parsedPayees.length === rows.length && !overBudget : true)

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return
    setSubmitting(true)
    mutation.sendTransaction({
      payees: hasBudget ? parsedPayees : [],
      devNickname: devNickname.trim(),
      discussionLink: discussionLink.trim(),
    })
  }, [canSubmit, mutation, parsedPayees, devNickname, discussionLink, hasBudget])

  const updateRow = (idx: number, patch: Partial<PayeeRow>) => {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }
  const addRow = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx))

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={t("Register developers and payouts")}
      showCloseButton
      isCloseable>
      <VStack w="full" align="stretch" gap={6}>
        <Heading size="lg">{t("Register developers and payouts")}</Heading>
        <Text textStyle="sm" color="gray.500">
          {t(
            "Move this proposal to In Development by registering the developer(s) who will implement it. The total payout cannot exceed the budget approved by voters.",
          )}
        </Text>

        <Field.Root>
          <Field.Label>{t("Developer nickname")}</Field.Label>
          <Input
            data-testid="dev-nickname-input"
            value={devNickname}
            onChange={e => setDevNickname(e.target.value)}
            placeholder={t("e.g. alice, my-dev-team")}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>{t("Discussion link")}</Field.Label>
          <Input
            data-testid="discussion-link-input"
            value={discussionLink}
            onChange={e => setDiscussionLink(e.target.value)}
            placeholder="https://vechain.discourse.group/..."
          />
        </Field.Root>

        {hasBudget && (
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between">
              <Text>{t("Payees")}</Text>
              <Text textStyle="xs" color="gray.500">
                {t("Budget cap: {{cap}} B3TR", {
                  cap: budgetEther.toLocaleString(undefined, { maximumFractionDigits: 4 }),
                })}
              </Text>
            </HStack>
            {rows.map((row, idx) => {
              const validAddr = !row.address || isAddress(row.address)
              const parsedAmount = parseAmountToWei(row.amount)
              const validAmount = !row.amount || (parsedAmount !== null && parsedAmount > 0n)
              return (
                <Stack key={idx} direction={["column", "row"]} gap={2} align={["stretch", "flex-start"]}>
                  <Field.Root invalid={!validAddr} flex={2}>
                    <Input
                      data-testid={`payee-address-${idx}`}
                      placeholder="0x..."
                      value={row.address}
                      onChange={e => updateRow(idx, { address: e.target.value })}
                    />
                    {!validAddr && <Field.ErrorText>{t("Invalid address")}</Field.ErrorText>}
                  </Field.Root>
                  <Field.Root invalid={!validAmount} flex={1}>
                    <Input
                      data-testid={`payee-amount-${idx}`}
                      placeholder={t("B3TR amount")}
                      type="number"
                      min={0}
                      step={1}
                      value={row.amount}
                      onChange={e => updateRow(idx, { amount: e.target.value })}
                    />
                    {!validAmount && <Field.ErrorText>{t("Invalid amount")}</Field.ErrorText>}
                  </Field.Root>
                  <IconButton
                    aria-label={t("Remove payee")}
                    variant="ghost"
                    onClick={() => removeRow(idx)}
                    disabled={rows.length === 1}>
                    <MdClose />
                  </IconButton>
                </Stack>
              )
            })}

            <Button variant="outline" size="sm" onClick={addRow}>
              <MdAdd />
              {t("Add payee")}
            </Button>

            <Box pt={2}>
              <Text textStyle="sm" color={overBudget ? "red.500" : "gray.600"}>
                {t("Total: {{sum}} B3TR / {{cap}} B3TR", {
                  sum: sumEther.toLocaleString(undefined, { maximumFractionDigits: 4 }),
                  cap: budgetEther.toLocaleString(undefined, { maximumFractionDigits: 4 }),
                })}
                {sumUsd !== undefined && ` (≈ ${sumUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD)`}
              </Text>
              {overBudget && (
                <Text textStyle="sm" color="red.500">
                  {t("Sum of payouts exceeds the approved budget. Reduce amounts before submitting.")}
                </Text>
              )}
            </Box>
          </VStack>
        )}

        <Button
          variant="primary"
          alignSelf="flex-end"
          disabled={!canSubmit}
          onClick={handleSubmit}
          data-testid="mark-in-development-submit">
          {t("Mark as In Development")}
        </Button>
      </VStack>
    </BaseModal>
  )
}

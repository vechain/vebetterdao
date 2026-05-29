"use client"
import { Alert, Box, Button, Card, HStack, Heading, Separator, Text, VStack } from "@chakra-ui/react"
import { humanNumber } from "@repo/utils/FormattingUtils"
import MDEditor from "@uiw/react-md-editor"
import "@uiw/react-md-editor/markdown-editor.css"
import { ethers } from "ethers"
import { InfoCircle } from "iconoir-react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useTreasuryB3trTransferLimit } from "@/api/contracts/treasury/useTreasuryTransferLimit"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { ProposalSupportProgressChart } from "@/components/ProposalSupportProgressChart/ProposalSupportProgressChart"
import { useMainnetB3TRPrice } from "@/hooks/useMainnetB3TRPrice"

import { useDepositThreshold } from "../../../../../../api/contracts/governance/hooks/useDepositThreshold"
import { useHashProposal } from "../../../../../../api/contracts/governance/hooks/useHashProposal"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "../../../../../../constants/AnalyticsEvents"
import { useCreateStandardProposal } from "../../../../../../hooks/proposals/standard/useCreateStandardProposal"
import { useUploadProposalMetadata } from "../../../../../../hooks/useUploadProposalMetadata"
import { useProposalFormStore } from "../../../../../../store/useProposalFormStore"
import AnalyticsUtils from "../../../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { NewProposalForm } from "../../functions/details/components/NewProposalForm"
import { SelectedRoundRadioCard } from "../../round/components/SelectedRoundRadioCard"

export const PublishAndPreviewPageContent = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const {
    actions,
    markdownDescription,
    title,
    shortDescription,
    votingStartRoundId,
    depositAmount,
    metadataUri,
    maxBudget,
  } = useProposalFormStore()
  const [proposalDescriptionUriHash, setProposalDescriptionUriHash] = useState<string | undefined>(undefined)
  const { data: threshold } = useDepositThreshold()
  const { data: b3trUsdPrice } = useMainnetB3TRPrice()
  const { data: treasuryB3trLimit } = useTreasuryB3trTransferLimit()
  const maxBudgetNumber = useMemo(() => {
    const n = Number(maxBudget)
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [maxBudget])
  // Block publish if maxBudget exceeds Treasury's per-call B3TR limit — claimPayout would revert forever.
  const budgetExceedsTreasuryLimit = useMemo(() => {
    if (treasuryB3trLimit === undefined || !maxBudget) return false
    try {
      return ethers.parseEther(maxBudget) > (treasuryB3trLimit as unknown as bigint)
    } catch {
      return false
    }
  }, [treasuryB3trLimit, maxBudget])
  const treasuryB3trLimitFormatted = useMemo(
    () =>
      treasuryB3trLimit !== undefined ? humanNumber(ethers.formatEther(treasuryB3trLimit as unknown as bigint)) : "",
    [treasuryB3trLimit],
  )
  const maxBudgetUsd = useMemo(() => {
    if (maxBudgetNumber <= 0) return undefined
    const price = Number(b3trUsdPrice)
    if (!Number.isFinite(price) || price <= 0) return undefined
    return maxBudgetNumber * price
  }, [maxBudgetNumber, b3trUsdPrice])
  // We call the hashProposal function to precalculate the proposal id
  // so we can redirect the user to the proposal page after the tx is confirmed
  const { data: expectedProposalId } = useHashProposal(
    actions.map(action => ({
      contractAddress: action.contractAddress,
      calldata: action.calldata as string,
    })),
    proposalDescriptionUriHash ?? "",
  )
  const onSuccess = useCallback(() => {
    //Redirect to the proposal page
    router.push(`/proposals/${expectedProposalId}`)
  }, [router, expectedProposalId])
  const createProposalMutation = useCreateStandardProposal({
    onSuccess,
    transactionModalCustomUI: {
      waitingConfirmation: {
        title: t("Creating proposal..."),
      },
      success: {
        title: t("Proposal Created!"),
      },
      error: {
        title: t("Error creating proposal!"),
      },
    },
  })

  const { onMetadataUpload } = useUploadProposalMetadata()

  const isDepositReached = useMemo(
    () => !!depositAmount && !!threshold && depositAmount >= Number(threshold),
    [depositAmount, threshold],
  )

  const onSubmit = useCallback(async () => {
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CREATE_PROPOSAL_SUBMITED))
    createProposalMutation.resetStatus()
    if (!title || !shortDescription || !markdownDescription || depositAmount === undefined)
      throw new Error("Missing data")
    //Try to use the metadata uri from the form store, if it's not set, upload the metadata and use the uploaded uri
    let uploadedMetadataUri = metadataUri
    if (!uploadedMetadataUri) {
      uploadedMetadataUri = await onMetadataUpload({ title, shortDescription, markdownDescription })
      if (!uploadedMetadataUri) throw new Error("Failed to upload metadata")
    }

    // We hash the metadata uri, which will be used by the useHashProposal hook to calculate the proposal id
    setProposalDescriptionUriHash(ethers.keccak256(ethers.toUtf8Bytes(uploadedMetadataUri)))

    if (!votingStartRoundId || !actions || !shortDescription) throw new Error("Missing data")

    const isSomeCalldataEmpty = actions.some(action => !action.calldata)
    if (isSomeCalldataEmpty) throw new Error("Missing calldata for some actions")

    createProposalMutation.sendTransaction({
      actions: actions.map(action => ({
        contractAddress: action.contractAddress,
        calldata: action.calldata as string,
      })),
      description: uploadedMetadataUri,
      startRoundId: votingStartRoundId,
      depositAmount: depositAmount.toString(),
      maxBudget,
    })
  }, [
    createProposalMutation,
    title,
    shortDescription,
    markdownDescription,
    depositAmount,
    metadataUri,
    votingStartRoundId,
    actions,
    onMetadataUpload,
    maxBudget,
  ])

  return (
    <Card.Root w="full" data-testid="new-proposal-preview-page" variant="primary">
      <Card.Body py={8}>
        <VStack gap={8} align="flex-start" separator={<Separator />}>
          <Heading size={["xl", "2xl"]}>{t("Check your proposal before publishing")}</Heading>
          <Box w="full" className="wmde-markdown-var">
            <MDEditor.Markdown
              source={markdownDescription}
              style={{
                width: "100%",
                wordBreak: "break-word",
              }}
            />
          </Box>
          {!!actions.length && (
            <NewProposalForm
              renderTitle={false}
              renderDescription={false}
              isDisabled={true}
              canAddAnotherTransaction={false}
            />
          )}

          <VStack gap={2} align="flex-start" w="full">
            <Heading size={["sm", "md"]}>{t("Implementation cost")}</Heading>
            {maxBudgetNumber > 0 ? (
              <>
                <Text textStyle="sm" color="gray.500">
                  {t(
                    "Maximum amount that may be paid from the Treasury for implementing this proposal. After approval, you’ll register a single payout address that will receive the full amount in one transfer and will be responsible for distributing funds off-chain to all contributors (developers, PMs, designers, etc.).",
                  )}
                </Text>
                <HStack gap={3} align="center" mt={2}>
                  <B3TRIcon boxSize={8} colorVariant="dark" />
                  <Heading size={["lg", "lg", "2xl"]}>
                    {`${maxBudgetNumber.toLocaleString(undefined, { maximumFractionDigits: 4 })} B3TR`}
                  </Heading>
                  {maxBudgetUsd !== undefined && (
                    <Heading size={["md", "md", "xl"]} color="gray.500">
                      {`≈ $${maxBudgetUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    </Heading>
                  )}
                </HStack>
              </>
            ) : (
              <Text textStyle="sm" color="gray.500">
                {t("This proposal has no implementation cost — no payout will be made from Treasury.")}
              </Text>
            )}
          </VStack>

          <VStack gap={4} align="flex-start" w="full">
            <Heading size={["sm", "md"]}>{t("Voting session")}</Heading>
            {votingStartRoundId && (
              <SelectedRoundRadioCard
                roundId={votingStartRoundId}
                selected={false}
                isSelectable={false}
                cardProps={{
                  bg: "b3tr-balance-bg",
                }}
              />
            )}
          </VStack>

          <VStack gap={4} align="flex-start" w="full">
            <Heading size={["sm", "md"]}>{t("Community support")}</Heading>
            {depositAmount !== undefined && threshold && (
              <ProposalSupportProgressChart
                isDepositThresholdReached={isDepositReached}
                isFailedDueToDeposit={false}
                depositThreshold={Number(threshold)}
                userDeposits={Number(depositAmount)}
                othersDeposits={0}
                otherDepositsUsersCount={0}
                renderVotesDistributionLabel={false}
              />
            )}
          </VStack>

          {budgetExceedsTreasuryLimit && (
            <Alert.Root status="error" py="2" px="3">
              <HStack alignItems="flex-start" gap="2" w="full">
                <Alert.Indicator boxSize="4" flexShrink={0} mt="0.5">
                  <InfoCircle />
                </Alert.Indicator>
                <Text textStyle="sm" fontWeight="medium" color="status.negative.strong">
                  {t(
                    "Budget exceeds Treasury's per-transfer B3TR limit ({{limit}} B3TR). Go back and lower the Implementation Cost — otherwise the payout will be permanently unclaimable.",
                    { limit: treasuryB3trLimitFormatted },
                  )}
                </Text>
              </HStack>
            </Alert.Root>
          )}

          <HStack alignSelf={"flex-end"} justify={"flex-end"} gap={4} flex={1}>
            <Button data-testid="go-back" variant="link" onClick={router.back}>
              {t("Go back")}
            </Button>
            <Button data-testid="publish" variant="primary" onClick={onSubmit} disabled={budgetExceedsTreasuryLimit}>
              {t("Publish")}
            </Button>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

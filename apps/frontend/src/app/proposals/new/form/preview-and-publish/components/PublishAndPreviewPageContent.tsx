"use client"

import MDEditor from "@uiw/react-md-editor"
import "@uiw/react-md-editor/markdown-editor.css"
import { Button, Card, Separator, HStack, Heading, VStack } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useProposalFormStore } from "@/store"
import { NewProposalForm } from "../../functions/details/components/NewProposalForm"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useCreateProposal, useUploadProposalMetadata } from "@/hooks"
import { SelectedRoundRadioCard } from "../../round/components/SelectedRoundRadioCard"
import { ProposalSupportProgressChart } from "@/components/ProposalSupportProgressChart/ProposalSupportProgressChart"
import { useDepositThreshold, useHashProposal } from "@/api"
import { ethers } from "ethers"
import { AnalyticsUtils } from "@/utils"
import { buttonClicked, buttonClickActions, ButtonClickProperties } from "@/constants"

export const PublishAndPreviewPageContent = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { actions, markdownDescription, title, shortDescription, votingStartRoundId, depositAmount, metadataUri } =
    useProposalFormStore()
  const [proposalDescriptionUriHash, setProposalDescriptionUriHash] = useState<string | undefined>(undefined)

  const { data: threshold } = useDepositThreshold()

  const goBack = useCallback(() => {
    router.back()
  }, [router])

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

  const createProposalMutation = useCreateProposal({
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
  ])

  return (
    <Card.Root w="full" data-testid="new-proposal-preview-page" variant="baseWithBorder">
      <Card.Body py={8}>
        <VStack gap={8} align="flex-start" separator={<Separator />}>
          <Heading size={["md", "lg"]}>{t("Check your proposal before publishing")}</Heading>
          <MDEditor.Markdown
            source={markdownDescription}
            style={{
              width: "100%",
              wordBreak: "break-word",
            }}
          />
          {!!actions.length && (
            <NewProposalForm
              renderTitle={false}
              renderDescription={false}
              isDisabled={true}
              canAddAnotherTransaction={false}
            />
          )}

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

          <HStack alignSelf={"flex-end"} justify={"flex-end"} gap={4} flex={1}>
            <Button data-testid="go-back" variant="primarySubtle" onClick={goBack}>
              {t("Go back")}
            </Button>
            <Button data-testid="publish" variant="primaryAction" onClick={onSubmit}>
              {t("Publish")}
            </Button>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

"use client"

import { Button, Card, CardBody, Divider, HStack, Heading, VStack, useDisclosure } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { NewProposalForm } from "../../functions/details/components/NewProposalForm"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useCreateProposal, useUploadProposalMetadata } from "@/hooks"
import { TransactionModal } from "@/components/TransactionModal"
import { useForm } from "react-hook-form"
import { SelectedRoundRadioCard } from "../../round/components/SelectedRoundRadioCard"
import { ProposalSupportProgressChart } from "@/components/ProposalSupportProgressChart/ProposalSupportProgressChart"
import { useDepositThreshold } from "@/api"

export const PublishAndPreviewPageContent = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { actions, markdownDescription, title, shortDescription, votingStartRoundId, depositAmount } =
    useProposalFormStore()

  const { data: threshold, isLoading: thresholdLoading } = useDepositThreshold()

  const { handleSubmit } = useForm()

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()

  const onSuccess = useCallback(() => router.push("/proposals"), [router])

  const createProposalMutation = useCreateProposal({ onSuccess })

  const { onMetadataUpload, metadataUploadError, metadataUploading } = useUploadProposalMetadata()

  const isDepositReached = useMemo(
    () => !!depositAmount && !!threshold && depositAmount >= Number(threshold),
    [depositAmount, threshold],
  )

  const onSubmit = useCallback(async () => {
    createProposalMutation.resetStatus()
    onConfirmationOpen()
    if (!title || !shortDescription || !markdownDescription || depositAmount === undefined)
      throw new Error("Missing data")
    const metadataUri = await onMetadataUpload({ title, shortDescription, markdownDescription })
    if (!metadataUri) return

    if (!votingStartRoundId || !actions || !shortDescription) throw new Error("Missing data")

    const isSomeCalldataEmpty = actions.some(action => !action.calldata)
    if (isSomeCalldataEmpty) throw new Error("Missing calldata for some actions")
    createProposalMutation.sendTransaction({
      actions: actions.map(action => ({
        contractAddress: action.contractAddress,
        calldata: action.calldata as string,
      })),
      description: metadataUri,
      startRoundId: votingStartRoundId,
      depositAmount: depositAmount.toString(),
    })
  }, [
    onConfirmationOpen,
    createProposalMutation,
    title,
    shortDescription,
    markdownDescription,
    actions,
    votingStartRoundId,
    onMetadataUpload,
    depositAmount,
  ])

  const onTryAgain = useCallback(() => {
    createProposalMutation.resetStatus()
    handleSubmit(onSubmit)()
  }, [createProposalMutation, handleSubmit, onSubmit])

  return (
    <>
      <TransactionModal
        isOpen={isConfirmationOpen}
        onClose={onConfirmationClose}
        confirmationTitle="Create a proposal"
        successTitle="Proposal created!"
        status={
          metadataUploading
            ? "uploadingMetadata"
            : createProposalMutation.error || metadataUploadError
              ? "error"
              : createProposalMutation.status
        }
        errorDescription={metadataUploadError?.message ?? createProposalMutation.error?.reason}
        errorTitle={
          metadataUploadError
            ? "Error uploading metadata"
            : createProposalMutation.error
              ? "Error updating app details"
              : undefined
        }
        showTryAgainButton={true}
        onTryAgain={onTryAgain}
        pendingTitle="Creating proposal..."
        txId={createProposalMutation.txReceipt?.meta.txID}
        showExplorerButton
      />

      <Card w="full">
        <CardBody py={8}>
          <VStack spacing={8} align="flex-start" divider={<Divider />}>
            <Heading size="lg">{t("Check your proposal before publishing")}</Heading>
            <MarkdownPreview
              source={markdownDescription}
              style={{
                padding: "1rem",
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

            <VStack spacing={4} align="flex-start" w="full">
              <Heading size="md">{t("Voting session")}</Heading>
              {votingStartRoundId && (
                <SelectedRoundRadioCard
                  roundId={votingStartRoundId}
                  selected={false}
                  isSelectable={false}
                  cardProps={{
                    bg: "#E5EEFF",
                  }}
                />
              )}
            </VStack>

            <VStack spacing={4} align="flex-start" w="full">
              <Heading size="md">{t("Community support")}</Heading>
              {depositAmount && threshold && (
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

            <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
              <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
                {t("Go back")}
              </Button>
              <Button rounded="full" colorScheme="primary" size="lg" onClick={onSubmit}>
                {t("Publish")}
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </>
  )
}

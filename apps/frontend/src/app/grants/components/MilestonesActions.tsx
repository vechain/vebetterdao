import { Accordion, Button, Circle, Icon, Skeleton, Steps, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts/factories/GrantsManager__factory"
import { executeCallClause, useThor, useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { EditPencil, Prohibition } from "iconoir-react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { BsCheck } from "react-icons/bs"

import { getIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import { toaster } from "@/components/ui/toaster"
import {
  buildMilestoneChainMetadata,
  parseMilestoneMetadataDocument,
} from "@/hooks/proposals/grants/milestoneMetadataDocument"
import {
  ExpenditureReport,
  GrantFormData,
  GrantProposalEnriched,
  MilestoneState,
  ProposalState,
} from "@/hooks/proposals/grants/types"
import { useAllMilestoneStates } from "@/hooks/proposals/grants/useAllMilestoneStates"
import { useSubmitExpenditureReport } from "@/hooks/proposals/grants/useSubmitExpenditureReport"
import { useUpdateGrantMilestoneMetadata } from "@/hooks/proposals/grants/useUpdateGrantMilestoneMetadata"
import { useUploadGrantProposalMetadata } from "@/hooks/useUploadGrantProposalMetadata"
import { uploadBlobToIPFS } from "@/utils/ipfs"

import { GenericAlert } from "../../components/Alert/GenericAlert"

import { ExpenditureReportForm } from "./ExpenditureReportForm"
import { ExpenditureReportView } from "./ExpenditureReportView"
import { MilestoneItem } from "./MilestoneItem"

export const MilestonesActions = ({ proposal }: { proposal?: GrantProposalEnriched }) => {
  // ==========================================
  // HOOKS
  // ==========================================
  const { account } = useWallet()
  const thor = useThor()
  const { data: milestoneStatesData, isLoading } = useAllMilestoneStates(proposal)
  const { t } = useTranslation()
  const [accordionValue, setAccordionValue] = useState<string[]>([])
  const [milestoneEditIndex, setMilestoneEditIndex] = useState<number>()
  const [milestoneDuration, setMilestoneDuration] = useState<{ from: string; to: string } | undefined>(undefined)
  const { metadataUploading } = useUploadGrantProposalMetadata()
  const { sendTransaction: updateMilestoneMetadata } = useUpdateGrantMilestoneMetadata(proposal?.id || "")
  const { submitReport } = useSubmitExpenditureReport()
  const [showReportForm, setShowReportForm] = useState(false)
  const [isPublishingReport, setIsPublishingReport] = useState(false)

  const isGrantReceiver = useMemo(() => {
    return account?.address && proposal?.grantsReceiverAddress
      ? compareAddresses(account.address, proposal.grantsReceiverAddress)
      : false
  }, [account?.address, proposal?.grantsReceiverAddress])

  const isProposer = useMemo(() => {
    return account?.address && proposal?.proposerAddress
      ? compareAddresses(account.address, proposal.proposerAddress)
      : false
  }, [account?.address, proposal?.proposerAddress])

  const isInDevelopment = proposal?.state === ProposalState.InDevelopment

  const handleReportSubmit = useCallback(
    async (report: ExpenditureReport) => {
      if (!proposal?.id || !proposal.milestones?.length) {
        toaster.create({ description: t("Failed to submit expenditure report"), type: "error", closable: true })
        return
      }
      setIsPublishingReport(true)
      try {
        const cid = await submitReport({
          proposalId: proposal.id,
          report,
          fallbackMilestones: proposal.milestones,
        })
        if (!cid) {
          toaster.create({ description: t("Failed to submit expenditure report"), type: "error", closable: true })
          return
        }
        await updateMilestoneMetadata(cid)
        setShowReportForm(false)
        toaster.create({ description: t("Expenditure report submitted successfully"), type: "success", closable: true })
      } catch {
        toaster.create({ description: t("Failed to submit expenditure report"), type: "error", closable: true })
      } finally {
        setIsPublishingReport(false)
      }
    },
    [proposal, submitReport, updateMilestoneMetadata, t],
  )

  const milestones = useMemo(() => {
    return (
      proposal?.milestones
        .map((milestone, index) => ({
          milestone,
          state: milestoneStatesData?.find(item => item.index === index)?.state ?? MilestoneState.Pending,
          index,
        }))
        .filter(item => item.milestone !== undefined) || []
    )
  }, [milestoneStatesData, proposal?.milestones])
  const currentStep = useMemo(() => {
    // Find first pending/rejected milestone, or return last index if all completed, or 0 if empty
    const firstPendingIndex = milestones.findIndex(
      milestone => milestone.state === MilestoneState.Pending || milestone.state === MilestoneState.Rejected,
    )
    return firstPendingIndex >= 0 ? firstPendingIndex : Math.max(0, milestones.length - 1)
  }, [milestones])

  const existingReport = useMemo(() => {
    const tranche = currentStep + 1
    return proposal?.expenditureReports?.find(r => r.trancheNumber === tranche)
  }, [proposal?.expenditureReports, currentStep])

  const handleSaveEdit = useCallback(
    async (clickedIndex: number) => {
      if (!!milestoneDuration) {
        if (milestoneEditIndex === undefined) return
        if (!thor || !proposal?.id) return
        const updatedMilestones = [] as GrantFormData["milestones"]
        let loopIdx = 0
        for (const milestone of proposal?.milestones ?? []) {
          if (loopIdx === milestoneEditIndex) {
            updatedMilestones.push({
              ...milestone,
              durationFrom: dayjs(milestoneDuration.from).unix(),
              durationTo: dayjs(milestoneDuration.to).unix(),
            })
          } else {
            updatedMilestones.push(milestone)
          }
          loopIdx++
        }

        // Re-read on-chain CID + IPFS doc so a concurrently submitted expenditure
        // report (other tab, or after this component's cache loaded) is not overwritten.
        const [milestoneMetadataURI] = await executeCallClause({
          thor,
          abi: GrantsManager__factory.abi,
          contractAddress: getConfig().grantsManagerContractAddress,
          method: "getMilestoneMetadataURI",
          args: [BigInt(proposal.id)],
        })
        let existingRaw: unknown
        if (milestoneMetadataURI && String(milestoneMetadataURI).length > 0) {
          existingRaw = await getIpfsMetadata<unknown>(`ipfs://${milestoneMetadataURI}`)
        }
        const parsed = parseMilestoneMetadataDocument(existingRaw, proposal?.milestones ?? [])

        const payload = buildMilestoneChainMetadata(updatedMilestones, parsed.expenditureReports)
        const metadataBlob = new Blob([JSON.stringify(payload)], { type: "application/json" })
        const ipfsURI = await uploadBlobToIPFS(metadataBlob, "grant-milestone-metadata.json")
        if (!ipfsURI) {
          toaster.create({ description: t("Failed to upload milestone metadata"), type: "error", closable: true })
          return
        }
        await updateMilestoneMetadata(ipfsURI)

        setMilestoneEditIndex(undefined)
        setMilestoneDuration(undefined)
      } else {
        setMilestoneEditIndex(clickedIndex)
        setMilestoneDuration(undefined)
      }
    },
    [milestoneDuration, milestoneEditIndex, proposal?.id, proposal?.milestones, thor, updateMilestoneMetadata, t],
  )

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    if (milestones.length > 0) {
      const allAccordionValues = milestones.map((_, index) => `milestone-accordion-item-${index}`)
      setAccordionValue(allAccordionValues)
    }
  }, [milestones])

  const currentStepIndicator = useCallback(
    (index: number) => {
      if (milestones?.[index]?.state === MilestoneState.Rejected) {
        return (
          <Circle bg="actions.primary.default" size="50%" zIndex={2}>
            <Icon as={Prohibition} boxSize={3} color="actions.primary.text" />
          </Circle>
        )
      }
      return <Circle bg="actions.primary.default" size="55%" zIndex={2} />
    },
    [milestones],
  )

  const getFirstRejectedMilestone = useCallback(() => {
    return milestones?.findIndex(milestone => milestone.state === MilestoneState.Rejected) ?? -1
  }, [milestones])

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Skeleton loading={isLoading}>
      {/* Expenditure Report Section — on-chain metadata is updated by the proposal proposer */}
      {isInDevelopment && isProposer && !showReportForm && (
        <VStack align="flex-start" gap={3} pb={4}>
          <Button variant="secondary" size="sm" onClick={() => setShowReportForm(true)}>
            {existingReport ? t("Update expenditure report") : t("Submit expenditure report")}
          </Button>
        </VStack>
      )}
      {isInDevelopment && isGrantReceiver && !isProposer && (
        <Text textStyle="sm" color="text.subtle" pb={4}>
          {t("Expenditure reports are submitted by the proposal proposer wallet.")}
        </Text>
      )}

      {showReportForm && proposal && (
        <VStack pb={6}>
          <ExpenditureReportForm
            proposal={proposal}
            currentMilestoneIndex={currentStep}
            totalMilestones={milestones.length}
            onSubmit={handleReportSubmit}
            onCancel={() => setShowReportForm(false)}
            isSubmitting={isPublishingReport}
          />
        </VStack>
      )}

      {existingReport && !showReportForm && (
        <VStack pb={6} p={4} borderWidth="1px" borderRadius="xl" borderColor="border.primary">
          <ExpenditureReportView report={existingReport} />
        </VStack>
      )}

      <Steps.Root
        orientation="vertical"
        defaultStep={0}
        count={milestones.length}
        size="sm"
        w="full"
        h="full"
        step={currentStep}
        colorPalette="blue"
        variant="primary"
        pt={{ base: "0", md: "40px" }}>
        <Steps.List flex={1}>
          <Accordion.Root
            multiple // allow any item to be open
            value={accordionValue}
            onValueChange={details => setAccordionValue(details.value)}
            w="full">
            {milestones.map((milestone, index) => (
              <Steps.Item
                key={`milestone-step-${milestone.index}`}
                index={index}
                color={index === currentStep ? "text.default" : "text.subtle"}>
                <Steps.Indicator>
                  <Steps.Status
                    incomplete={<Circle bg="actions.primary.default" size="0" />}
                    complete={
                      <Circle bg="actions.primary.default" size="50%" zIndex={2}>
                        <Icon as={BsCheck} boxSize={4} color="actions.primary.text" />
                      </Circle>
                    }
                    current={currentStepIndicator(index)}
                  />
                </Steps.Indicator>
                <Steps.Separator />
                <VStack pb={"24px"} align="flex-start" w="full" flex={1}>
                  <Accordion.Item value={`milestone-accordion-item-${index}`} border="none" w="full">
                    {/* Milestone header */}
                    <VStack align="flex-start" gap={"16px"} pb={"16px"}>
                      <Accordion.ItemTrigger py={1} display="flex" justifyContent="space-between" w="full">
                        <Text textStyle="lg" fontWeight={"semibold"}>
                          {t("Milestone {{milestoneNumber}}", { milestoneNumber: index + 1 })}
                        </Text>
                        {milestone.milestone?.durationFrom &&
                          dayjs(milestone.milestone.durationFrom * 1000).isAfter(dayjs()) &&
                          compareAddresses(account?.address, proposal?.proposerAddress) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              loading={metadataUploading}
                              onClick={e => {
                                e.stopPropagation()
                                handleSaveEdit(index)
                              }}>
                              {!milestoneDuration && <Icon as={EditPencil} />}
                              {!!milestoneDuration && index === milestoneEditIndex ? t("Save") : t("Edit")}
                            </Button>
                          )}
                      </Accordion.ItemTrigger>
                    </VStack>
                    <Accordion.ItemContent>
                      {proposal && (
                        <MilestoneItem
                          mode={milestoneEditIndex === index ? "edit" : "read"}
                          onDateChange={(durationFrom, durationTo) => {
                            setMilestoneDuration({ from: durationFrom, to: durationTo })
                          }}
                          milestoneData={milestone}
                          proposal={proposal}
                          isCurrentStep={index === currentStep}
                          milestoneIndex={index}
                        />
                      )}
                      {getFirstRejectedMilestone() === index && (
                        <GenericAlert
                          type="error"
                          message="This milestone was rejected by VeBetter Foundation. Contact the Foundation for feedback if needed."
                          isLoading={false}
                        />
                      )}
                    </Accordion.ItemContent>
                  </Accordion.Item>
                </VStack>
              </Steps.Item>
            ))}
          </Accordion.Root>
        </Steps.List>
      </Steps.Root>
    </Skeleton>
  )
}

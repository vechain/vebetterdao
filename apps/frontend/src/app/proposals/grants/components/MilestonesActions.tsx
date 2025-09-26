import { MilestoneItem } from "@/app/proposals/grants/components"
import { GrantFormData, GrantProposalEnriched, MilestoneState } from "@/hooks/proposals/grants/types"
import { useAllMilestoneStates } from "@/hooks/proposals/grants/useAllMilestoneStates"
import { Accordion, Button, Circle, Icon, Skeleton, Steps, Text, VStack } from "@chakra-ui/react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { BsCheck } from "react-icons/bs"
import { EditPencil } from "iconoir-react"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useUpdateGrantMilestoneMetadata } from "@/hooks/proposals/grants/useUpdateGrantMilestoneMetadata"
import { useUploadGrantProposalMetadata } from "@/hooks/useUploadGrantProposalMetadata"

export const MilestonesActions = ({ proposal }: { proposal?: GrantProposalEnriched }) => {
  // ==========================================
  // HOOKS
  // ==========================================
  const { account } = useWallet()
  const { data: milestoneStatesData, isLoading } = useAllMilestoneStates(proposal)
  const { t } = useTranslation()
  const [accordionValue, setAccordionValue] = useState<string[]>([])
  const [milestoneEditIndex, setMilestoneEditIndex] = useState<number>()
  const [milestoneDuration, setMilestoneDuration] = useState<{ from: string; to: string } | undefined>(undefined)

  const { onMetadataUpload, metadataUri, metadataUploading } = useUploadGrantProposalMetadata()

  const { sendTransaction: updateMilestoneMetadata } = useUpdateGrantMilestoneMetadata({
    proposalId: proposal?.id ?? "",
    milestonesIpfsCID: metadataUri ?? "",
  })

  const milestones = useMemo(() => {
    return milestoneStatesData?.filter(item => item.milestone !== undefined) ?? []
  }, [milestoneStatesData])

  const currentStep = useMemo(() => {
    // Find first pending/rejected milestone, or return last index if all completed, or 0 if empty
    const firstPendingIndex = milestones.findIndex(
      milestone => milestone.state === MilestoneState.Pending || milestone.state === MilestoneState.Rejected,
    )
    return firstPendingIndex >= 0 ? firstPendingIndex : Math.max(0, milestones.length - 1)
  }, [milestones])

  const handleSaveEdit = useCallback(
    async (index: number) => {
      if (!!milestoneDuration) {
        if (milestoneEditIndex === undefined) return
        const milestones = [] as GrantFormData["milestones"]
        let index = 0
        for (const milestone of proposal?.milestones ?? []) {
          if (index === milestoneEditIndex) {
            milestones.push({
              ...milestone,
              ...milestoneDuration,
            })
          } else {
            milestones.push(milestone)
          }
          index++
        }

        await onMetadataUpload(milestones)
        updateMilestoneMetadata()

        setMilestoneEditIndex(undefined)
        setMilestoneDuration(undefined)
      } else {
        setMilestoneEditIndex(index)
        setMilestoneDuration(undefined)
      }
    },
    [milestoneDuration, milestoneEditIndex, onMetadataUpload, proposal?.milestones, updateMilestoneMetadata],
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

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Skeleton loading={isLoading}>
      <Steps.Root
        orientation="vertical"
        defaultStep={0}
        count={milestones.length}
        size="sm"
        w="full"
        h="full"
        step={currentStep}
        colorPalette="blue"
        variant="primaryVertical"
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
                      <Circle bg="actions.primary.default" size="50%" zIndex={10}>
                        <Icon as={BsCheck} boxSize={4} color="actions.primary.text" />
                      </Circle>
                    }
                    current={<Circle bg="actions.primary.default" size="55%" zIndex={10} />}
                  />
                </Steps.Indicator>
                <Steps.Separator />
                <VStack pb={"24px"} align="flex-start" w="full" flex={1}>
                  <Accordion.Item value={`milestone-accordion-item-${index}`} border="none" w="full">
                    {/* Milestone header */}
                    <VStack align="flex-start" gap={"16px"} pb={"16px"}>
                      <Accordion.ItemTrigger py={1} display="flex" justifyContent="space-between" w="full">
                        <Text fontSize="lg" fontWeight={"semibold"}>
                          {t("Milestone {{milestoneNumber}}", { milestoneNumber: index + 1 })}
                        </Text>
                        {milestone.milestone?.durationFrom &&
                          dayjs(milestone.milestone.durationFrom * 1000).isAfter(dayjs()) &&
                          compareAddresses(account?.address, proposal?.proposerAddress) && (
                            <Button
                              variant="primarySubtle"
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

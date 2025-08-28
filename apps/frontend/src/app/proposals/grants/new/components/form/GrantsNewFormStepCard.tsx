import { useTranslation } from "react-i18next"
import { VStack, Card, Button, HStack, Stack } from "@chakra-ui/react"
import { GrantsNewFormStepIndicator } from "."
import { GrantTypeSelection } from "../GrantTypeSelection"
import { AboutGrant, Schedule, Milestones } from "./steps"
import { useForm } from "react-hook-form"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { useUploadGrantProposalMetadata } from "@/hooks/useUploadGrantProposalMetadata"
import { useCurrentAllocationsRoundId } from "@/api"
import { useCreateGrantProposal } from "@/hooks/proposals/grants/useCreateGrantProposal"
import { useRouter } from "next/navigation"
import { useGrantProposalFormStore } from "@/store"
import { useState } from "react"

export enum GrantFormStep {
  GRANT_TYPE = "GRANT_TYPE",
  ABOUT_GRANT = "ABOUT_GRANT",
  MILESTONES = "MILESTONES",
  SCHEDULE = "SCHEDULE",
}

export type GrantStep = {
  key: GrantFormStep
  content: React.ReactNode
  title: string
}

export const GrantsNewFormStepCard = () => {
  const { t } = useTranslation()

  const router = useRouter()

  const { setData, ...formData } = useGrantProposalFormStore()

  const { handleSubmit, control, register, formState, setValue, getValues, watch } = useForm<GrantFormData>({
    defaultValues: formData,
  })

  const { errors } = formState

  const steps: GrantStep[] = [
    {
      key: GrantFormStep.GRANT_TYPE,
      content: <GrantTypeSelection control={control} />,
      title: t("Type"),
    },
    {
      key: GrantFormStep.ABOUT_GRANT,
      content: <AboutGrant register={register} setValue={setValue} watch={watch} errors={errors} />,
      title: t("About grant"),
    },
    {
      key: GrantFormStep.MILESTONES,
      content: (
        <Milestones
          control={control}
          register={register}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          setData={setData}
          errors={errors}
          // pass current RHF values instead of the unstable spread store object
          formData={getValues()}
        />
      ),
      title: t("Milestones"),
    },
    {
      key: GrantFormStep.SCHEDULE,
      content: <Schedule register={register} errors={errors} control={control} watch={watch} />,
      title: t("Schedule"),
    },
  ]

  //MIMIC USE STEPS HOOK

  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const goToNext = () => {
    setCurrentStepIndex(prev => prev + 1)
  }

  const goToPrevious = () => {
    setCurrentStepIndex(prev => prev - 1)
  }

  const { onMetadataUpload } = useUploadGrantProposalMetadata()
  const { sendTransaction: createGrantProposal } = useCreateGrantProposal({
    onSuccess: () => {
      router.push(`/proposals/grants`)
    },
  })
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const onSubmit = async (data: GrantFormData) => {
    if (currentStepIndex !== lastStep) {
      return goToNext()
    }

    if (!currentRoundId || isNaN(Number(currentRoundId))) return

    const title = data.projectName
    const shortDescription = data.problemDescription
    const proposalMetadataURI = await onMetadataUpload({ ...data, title, shortDescription })
    if (!proposalMetadataURI) return console.error("Error uploading proposal metadata")

    const milestonesIpfsCID = await onMetadataUpload(data.milestones)
    if (!milestonesIpfsCID) return console.error("Error uploading milestones")
    if (!data.votingRoundId) return console.error("Support round ID is required")

    await createGrantProposal({
      metadataIpfsCID: proposalMetadataURI,
      milestonesIpfsCID,
      milestones: data.milestones,
      grantsReceiver: data.grantsReceiverAddress,
      votingRoundId: Number(data.votingRoundId),
      depositAmount: "0",
    })
  }

  const firstStep = 0
  const lastStep = steps.length - 1
  const currentStep = steps[currentStepIndex]

  return (
    <>
      <Card.Root>
        <Card.Header>
          <GrantsNewFormStepIndicator activeStep={currentStepIndex} steps={steps} />
        </Card.Header>
        <Card.Body px={{ base: 3, md: 8 }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <VStack gap={4} w="full" align="flex-start">
              {currentStep?.content}
              <Stack w="full" justify="space-between" direction={{ base: "column", md: "row" }}>
                <HStack gap={4} w="full">
                  {currentStepIndex !== firstStep && (
                    <Button onClick={goToPrevious} variant="secondary" px={8} size="lg">
                      {t("Back")}
                    </Button>
                  )}
                  <Button type="submit" variant="primaryAction" px={8} size="lg">
                    {currentStepIndex === lastStep ? t("Apply") : t("Continue")}
                  </Button>
                </HStack>
                {/* {stepsUI.value !== firstStep && (
                  <Button
                    variant="primaryLink"
                    onClick={handleSaveDraft}
                    px={8}
                    disabled={isSaveDraftDisabled}
                    _disabled={{
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }}>
                    {t("Save draft")}
                  </Button>
                )} */}
              </Stack>
            </VStack>
          </form>
        </Card.Body>
      </Card.Root>
    </>
  )
}

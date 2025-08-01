import { useTranslation } from "react-i18next"
import { VStack, CardHeader, CardBody, Card, useSteps, Button, HStack, Stack } from "@chakra-ui/react"
import { GrantsNewFormStepIndicator } from "."
import { GrantTypeSelection } from "../GrantTypeSelection"
import { AboutApplicant, AboutProject } from "./steps"
import { useForm } from "react-hook-form"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { useGrantProposalFormStore } from "@/store/useGrantProposalFormStore"
import { GrantMilestones } from "./steps/GrantMilestones"
import { useUploadGrantProposalMetadata } from "@/hooks/useUploadGrantProposalMetadata"
import { useCurrentAllocationsRoundId } from "@/api"
import { useCreateGrantProposal } from "@/hooks/proposals/grants/useCreateGrantProposal"
import { useRouter } from "next/navigation"

export enum GrantFormStep {
  GRANT_TYPE = "GRANT_TYPE",
  ABOUT_APPLICANT = "ABOUT_APPLICANT",
  ABOUT_PROJECT = "ABOUT_PROJECT",
  GRANT_MILESTONES = "GRANT_MILESTONES",
}

export type GrantStep = {
  key: GrantFormStep
  content: React.ReactNode
  title: string
}

export const GrantsNewFormStepCard = () => {
  const { t } = useTranslation()
  const { setData, ...formData } = useGrantProposalFormStore()
  const router = useRouter()
  const { handleSubmit, control, register, formState, setValue, getValues, watch } = useForm<GrantFormData>({
    defaultValues: formData,
  })

  const { errors } = formState

  const steps = [
    {
      key: GrantFormStep.GRANT_TYPE,
      content: <GrantTypeSelection control={control} />,
      title: t("Type of grant"),
    },
    {
      key: GrantFormStep.ABOUT_APPLICANT,
      content: <AboutApplicant register={register} errors={errors} />,
      title: t("About applicant"),
    },
    {
      key: GrantFormStep.ABOUT_PROJECT,
      content: <AboutProject register={register} setValue={setValue} watch={watch} errors={errors} />,
      title: t("About project"),
    },
    {
      key: GrantFormStep.GRANT_MILESTONES,
      content: (
        <GrantMilestones
          register={register}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          setData={setData}
          errors={errors}
          formData={formData}
        />
      ),
      title: t("Grant Milestones"),
    },
  ]

  const { activeStep, goToNext, goToPrevious } = useSteps({
    index: 0,
    count: steps.length,
  })
  const { onMetadataUpload } = useUploadGrantProposalMetadata()
  const { sendTransaction: createGrantProposal } = useCreateGrantProposal({
    onSuccess: () => {
      router.push(`/proposals/grants`)
    },
  })
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const firstStep = 0
  const lastStep = steps.length - 1

  const onSubmit = async (data: GrantFormData) => {
    //Keep new and old data in the store
    setData({ ...data })
    if (activeStep !== lastStep) {
      return goToNext()
    }

    if (!currentRoundId || isNaN(Number(currentRoundId))) return //TODO: THROW ERROR

    const title = data.projectName
    const shortDescription = data.problemDescription
    const proposalMetadataURI = await onMetadataUpload({ ...data, title, shortDescription })
    if (!proposalMetadataURI) return console.error("Error uploading proposal metadata") //TODO: THROW ERROR

    //Upload the description and milestones to IPFS
    const milestonesIpfsCID = await onMetadataUpload(data.milestones)
    if (!milestonesIpfsCID) return console.error("Error uploading milestones") //TODO: THROW ERROR

    await createGrantProposal({
      metadataIpfsCID: proposalMetadataURI,
      milestonesIpfsCID,
      milestones: data.milestones,
      votingRoundId: Number(currentRoundId) + 2, //TODO: Make sure this is next round or possible round depending on min voting delay
      depositAmount: "0", //TODO: Add info from the form
    })
  }

  const handleSaveDraft = () => {
    //TODO: Move it to a generic useLocalStorage hook
    //TODO: Add a unique id to the draft proposal by pre computing the hash
    //Get the form data from the store
    //Save in a array of objects in local storage with the key "draft-grant-proposals"
    const draftProposals = JSON.parse(localStorage.getItem("draft-grant-proposals") || "[]")
    draftProposals.push(formData)
    localStorage.setItem("draft-grant-proposals", JSON.stringify(draftProposals))
  }

  const currentStep = steps[activeStep]

  return (
    <Card>
      <CardHeader>
        <GrantsNewFormStepIndicator activeStep={activeStep} steps={steps} />
      </CardHeader>
      <CardBody px={{ base: 3, md: 8 }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
          <VStack direction={{ base: "column", md: "row" }} spacing={4} w="full" align="flex-start">
            {currentStep?.content}
            <Stack w="full" justify="space-between" direction={{ base: "column", md: "row" }}>
              <HStack spacing={4} w="full">
                {activeStep !== firstStep && (
                  <Button onClick={goToPrevious} variant="secondary" px={8} size="lg" w={{ base: "full", md: "auto" }}>
                    {t("Back")}
                  </Button>
                )}
                <Button type="submit" variant="primaryAction" px={8} size="lg" w={{ base: "full", md: "auto" }}>
                  {activeStep === lastStep ? t("Apply") : t("Continue")}
                </Button>
              </HStack>
              {activeStep !== firstStep && (
                <Button variant="primaryLink" onClick={handleSaveDraft} px={8}>
                  {t("Save draft")}
                </Button>
              )}
            </Stack>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}

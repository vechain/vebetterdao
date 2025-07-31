import { useTranslation } from "react-i18next"
import { VStack, CardHeader, CardBody, Card, useSteps, Button, HStack } from "@chakra-ui/react"
import { GrantsNewFormStepIndicator } from "."
import { GrantTypeSelection } from "../GrantTypeSelection"
import { AboutApplicant, AboutProject } from "./steps"
import { useForm } from "react-hook-form"
import { GrantFormData } from "@/hooks/proposals/grants/types"
import { useGrantProposalFormStore } from "@/store/useGrantProposalFormStore"
import { GrantMilestones } from "./steps/GrantMilestones"
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

  const { handleSubmit, control, register, formState, setValue, watch } = useForm<GrantFormData>({
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
      content: <GrantMilestones register={register} errors={errors} />,
      title: t("Grant Milestones"),
    },
  ]

  const { activeStep, goToNext, goToPrevious } = useSteps({
    index: 0,
    count: steps.length,
  })
  const firstStep = 0
  const lastStep = steps.length - 1

  const onSubmit = async (data: GrantFormData) => {
    //Keep new and old data in the store
    setData({ ...data })
    if (activeStep !== lastStep) {
      goToNext()
    }
    console.log("Form submitted:", data)
  }

  const handleSaveDraft = () => {
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
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
          <VStack spacing={4} w="full" align="flex-start">
            {currentStep?.content}
            <HStack w="full" justify="space-between">
              <HStack spacing={4}>
                {activeStep !== firstStep && (
                  <Button onClick={goToPrevious} variant="secondary" px={8}>
                    {t("Back")}
                  </Button>
                )}
                <Button type="submit" variant="primaryAction" px={8}>
                  {activeStep === lastStep ? t("Apply") : t("Continue")}
                </Button>
              </HStack>
              {activeStep !== firstStep && (
                <Button variant="primaryLink" onClick={handleSaveDraft} px={8}>
                  {t("Save draft")}
                </Button>
              )}
            </HStack>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}

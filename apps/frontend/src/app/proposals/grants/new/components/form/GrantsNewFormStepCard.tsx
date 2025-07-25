import { useTranslation } from "react-i18next"
import { VStack, CardHeader, CardBody, Card, useSteps, Button, HStack, Text } from "@chakra-ui/react"
import { GrantsNewFormStepper } from "."
import { GrantTypeSelection } from "../GrantTypeSelection"
import { AboutApplicant, AboutProject } from "./steps"
import { useForm, FormProvider } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

export type GrantFormData = {
  grantType: string
  // About applicant
  applicantName: string
  applicantSurname: string
  applicantRole: string
  applicantProfileUrl: string
  applicantCountry?: string
  applicantCity?: string
  applicantStreet?: string
  applicantPostalCode?: string
  applicantBackground?: string
  // About project
  projectName: string
  companyName: string
  appTestnetUrl: string
  projectWebsite: string
  githubUsername: string
  twitterUsername: string
  discordUsername: string
  // Project details
  problemDescription: string
  solutionDescription: string
  targetUsers: string
  competitiveEdge: string
  // Outcomes
  benefitsToUsers: string
  benefitsToDApps: string
  benefitsToVeChainEcosystem: string
  x2EModel: string
  revenueModel: string
  highLevelRoadmap: string
  // Milestones
  milestones: Array<{
    title: string
    description: string
    deliverables: string
    timeline: string
    fundingAmount: string
  }>
}

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
  const router = useRouter()

  const methods = useForm<GrantFormData>({
    defaultValues: {
      grantType: "dapp",
      applicantName: "",
      applicantSurname: "",
      applicantRole: "",
      applicantProfileUrl: "",
      applicantCountry: "",
      applicantCity: "",
      applicantStreet: "",
      applicantPostalCode: "",
      applicantBackground: "",
      projectName: "",
      companyName: "",
      appTestnetUrl: "",
      projectWebsite: "",
      milestones: [],
      githubUsername: "",
      twitterUsername: "",
      discordUsername: "",
      problemDescription: "",
      solutionDescription: "",
      targetUsers: "",
      competitiveEdge: "",
      benefitsToUsers: "",
      benefitsToVeChainEcosystem: "",
      revenueModel: "",
      highLevelRoadmap: "",
    },
  })

  const steps = useMemo<GrantStep[]>(
    () => [
      {
        key: GrantFormStep.GRANT_TYPE,
        content: <GrantTypeSelection control={methods.control} />,
        title: t("Type of grant"),
      },
      {
        key: GrantFormStep.ABOUT_APPLICANT,
        content: <AboutApplicant register={methods.register} errors={methods.formState.errors} />,
        title: t("About applicant"),
      },
      {
        key: GrantFormStep.ABOUT_PROJECT,
        content: (
          <AboutProject
            register={methods.register}
            setValue={methods.setValue}
            watch={methods.watch}
            errors={methods.formState.errors}
          />
        ),
        title: t("About project"),
      },
      {
        key: GrantFormStep.GRANT_MILESTONES,
        content: <Text>{"lorem ipsum"}</Text>,
        title: t("Grant Milestones"),
      },
    ],
    [methods.control, methods.register, methods.formState.errors, t],
  )

  const { activeStep, goToNext } = useSteps({
    index: 0,
    count: steps.length,
  })
  const firstStep = 0
  const lastStep = steps.length - 1

  const onSubmit = (data: GrantFormData) => {
    // Handle form submission
    console.log("Form submitted:", data)
  }

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      methods.handleSubmit(onSubmit)()
    } else {
      goToNext()
    }
  }

  const handleSaveDraft = () => {
    router.push("/proposals/grants")
  }

  const currentStep = steps[activeStep]

  return (
    <Card>
      <CardHeader>
        <GrantsNewFormStepper activeStep={activeStep} steps={steps} />
      </CardHeader>
      <CardBody>
        <FormProvider {...methods}>
          <VStack spacing={4} w="full" align="flex-start">
            <form onSubmit={methods.handleSubmit(onSubmit)} style={{ width: "100%" }}>
              {currentStep?.content}
            </form>
            <HStack spacing={4} w="full" justify="flex-start">
              {activeStep !== firstStep && (
                <Button onClick={handleSaveDraft} variant="secondary" px={8}>
                  {t("Save draft")}
                </Button>
              )}

              {activeStep !== lastStep && (
                <Button onClick={handleNext} variant="primaryAction" px={8}>
                  {t("Continue")}
                </Button>
              )}
            </HStack>
          </VStack>
        </FormProvider>
      </CardBody>
    </Card>
  )
}

import { DotSymbol } from "@/components"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from "@chakra-ui/react"
import { TFunction } from "i18next"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

type CreateProposalStep = {
  key: string
  title: string
  description?: string
  pathnames?: string[]
}

const FunctionTypeSteps: (t: TFunction<"translation", undefined>) => CreateProposalStep[] = t => [
  { key: "creationMethod", title: t("Creation method") },
  { key: "proposalTopic", title: t("Proposal topic"), pathnames: ["/proposals/new/form/functions"] },
  {
    key: "basicsAndFunctions",
    title: t("Proposal basics and functions"),
    pathnames: ["/proposals/new/form/functions/details"],
  },
  { key: "details", title: t("Proposal details"), pathnames: ["/proposals/new/form/content"] },
  { key: "preview", title: t("Preview"), pathnames: ["/proposals/new/form/preview"] },
  { key: "round", title: t("Round"), pathnames: ["/proposals/new/form/round"] },
  { key: "fundingAndPublish", title: t("Funding and publish!"), pathnames: ["/proposals/new/form/fund-and-publish"] },
]

const DiscussionTypeSteps: (t: TFunction<"translation", undefined>) => CreateProposalStep[] = t => [
  { key: "creationMethod", title: t("Creation method") },
  { key: "details", title: t("Proposal basics"), pathnames: ["/proposals/new/form/discussion"] },
  { key: "details", title: t("Proposal details"), pathnames: ["/proposals/new/form/content"] },
  { key: "preview", title: t("Preview"), pathnames: ["/proposals/new/form/preview"] },
  { key: "round", title: t("Round"), pathnames: ["/proposals/new/form/round"] },
  { key: "fundingAndPublish", title: t("Funding and publish!"), pathnames: ["/proposals/new/form/fund-and-publish"] },
]

export const CreateProposalStepperCard = () => {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { actions } = useProposalFormStore()
  const [steps, setSteps] = useState<CreateProposalStep[]>([])

  const { activeStep, setActiveStep } = useSteps({
    index: 1,
    count: steps.length,
  })

  //set active step based on the current pathname
  useEffect(() => {
    const step = steps.find(step => step.pathnames?.includes(pathname))
    if (step) {
      setActiveStep(steps.indexOf(step))
    }
  }, [pathname, setActiveStep, steps])

  //set steps based on the current actions + pathname
  useEffect(() => {
    const isInFunctionsPage = pathname.includes("/proposals/new/form/functions")
    const hasActions = actions.length > 0

    if (isInFunctionsPage || hasActions) setSteps(FunctionTypeSteps(t))
    else setSteps(DiscussionTypeSteps(t))
  }, [actions, pathname, t])

  const height = useMemo(() => {
    return steps.length * 60
  }, [steps])

  return (
    <Card>
      <CardHeader>
        <Heading size="md">{t("Progress")}</Heading>
      </CardHeader>
      <CardBody>
        <Stepper
          size="sm"
          index={activeStep}
          orientation="vertical"
          colorScheme="primary"
          gap="0"
          height={height}
          mt={4}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<></>}
                  active={<DotSymbol color="primary.500" size={3} />}
                />
              </StepIndicator>

              <Box flexShrink="0">
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </Box>

              <StepSeparator />
            </Step>
          ))}
        </Stepper>
      </CardBody>
    </Card>
  )
}

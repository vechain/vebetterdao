import { useProposalFormStore } from "@/store"
import { Box, Card, Circle, Heading, Steps } from "@chakra-ui/react"
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
  { key: "round", title: t("Round"), pathnames: ["/proposals/new/form/round"] },
  { key: "support", title: t("Support"), pathnames: ["/proposals/new/form/support"] },
  { key: "preview", title: t("Preview and publish"), pathnames: ["/proposals/new/form/preview-and-publish"] },
]

const DiscussionTypeSteps: (t: TFunction<"translation", undefined>) => CreateProposalStep[] = t => [
  { key: "creationMethod", title: t("Creation method") },
  { key: "details", title: t("Proposal basics"), pathnames: ["/proposals/new/form/discussion"] },
  { key: "details", title: t("Proposal details"), pathnames: ["/proposals/new/form/content"] },
  { key: "round", title: t("Round"), pathnames: ["/proposals/new/form/round"] },
  { key: "support", title: t("Support"), pathnames: ["/proposals/new/form/support"] },
  { key: "preview", title: t("Preview and publish"), pathnames: ["/proposals/new/form/preview-and-publish"] },
]

export const CreateProposalStepperCard = () => {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { actions } = useProposalFormStore()
  const [steps, setSteps] = useState<CreateProposalStep[]>([])
  const [step, setStep] = useState(1)

  //set active step based on the current pathname
  useEffect(() => {
    const step = steps.find(step => step.pathnames?.includes(pathname))
    if (step) {
      setStep(steps.indexOf(step))
    }
  }, [pathname, setStep, steps])

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
    <Card.Root variant="primary">
      <Card.Header>
        <Heading size="xl">{t("Progress")}</Heading>
      </Card.Header>
      <Card.Body pt={4}>
        <Steps.Root
          variant={"primaryVertical"}
          size="xs"
          step={step}
          onStepChange={e => setStep(e.step)}
          count={steps.length}
          orientation="vertical"
          colorPalette="primary"
          gap="0"
          height={height}>
          <Steps.List>
            {steps.map((step, index) => (
              <Steps.Item key={step.key} index={index}>
                <Steps.Indicator>
                  <Steps.Status
                    incomplete={<Circle bg="actions.primary.default" size="0" />}
                    complete={<Circle bg="actions.primary.default" size="2" />}
                    current={<Circle bg="actions.primary.default" size="3" />}
                  />
                </Steps.Indicator>
                <Box flexShrink="0">
                  <Steps.Title>{step.title}</Steps.Title>
                  <Steps.Description>{step.description}</Steps.Description>
                </Box>
                <Steps.Separator />
              </Steps.Item>
            ))}
          </Steps.List>
        </Steps.Root>
      </Card.Body>
    </Card.Root>
  )
}

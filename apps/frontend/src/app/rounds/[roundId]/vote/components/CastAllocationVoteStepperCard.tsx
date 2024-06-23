import { DotSymbol } from "@/components"
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Step,
  StepIcon,
  StepIndicator,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from "@chakra-ui/react"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"

export const CastAllocationVoteStepperCard = () => {
  const { t } = useTranslation()
  const pathname = usePathname()
  const params = useParams()

  console.log("params", params, "pathname", pathname)

  const Steps = useMemo(
    () => [
      { key: "selectApps", title: t("Select Apps"), pathnames: ["/rounds/:roundId/vote"] },
      { key: "AssignPercentages", title: t("Assign percentages"), pathnames: ["/rounds/:roundId/vote/percentages"] },
      { key: "reviewAndConfirm", title: t("Review and confirm"), pathnames: ["/rounds/:roundId/vote/confirm"] },
    ],
    [t],
  )

  const { activeStep, setActiveStep } = useSteps({
    index: 1,
    count: Steps.length,
  })

  //set active step based on the current pathname
  useEffect(() => {
    const pathPattern = Object.keys(params).reduce(
      (acc, key) => acc.replace(params[key] as string, `:${key}`),
      pathname,
    )
    const step = Steps.find(step => step.pathnames?.includes(pathPattern))
    if (step) {
      setActiveStep(Steps.indexOf(step))
    }
  }, [pathname, params, setActiveStep, Steps])

  const height = useMemo(() => {
    return Steps.length * 60
  }, [Steps])

  return (
    <Card variant={"baseWithBorder"} w="full">
      <CardHeader>
        <Heading fontSize="24px" fontWeight={700}>
          {t("Progress")}
        </Heading>
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
          {Steps.map((step, index) => (
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
              </Box>

              <StepSeparator />
            </Step>
          ))}
        </Stepper>
      </CardBody>
    </Card>
  )
}

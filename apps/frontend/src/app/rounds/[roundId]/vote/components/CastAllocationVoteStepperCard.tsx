import { ResponsiveCard } from "@/components"
import { useBreakpoints } from "@/hooks"
import {
  Box,
  Circle,
  Heading,
  Step,
  StepIndicator,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  VStack,
  useSteps,
} from "@chakra-ui/react"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"

export const CastAllocationVoteStepperCard = () => {
  const { isDesktop } = useBreakpoints()
  const { t } = useTranslation()
  const pathname = usePathname()
  const params = useParams()

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
    <ResponsiveCard>
      <VStack spacing={8} w="full" align={"flex-start"}>
        {isDesktop && (
          <Heading fontSize="24px" fontWeight={700}>
            {t("Progress")}
          </Heading>
        )}
        <Stepper
          w="full"
          size="sm"
          index={activeStep}
          orientation={isDesktop ? "vertical" : "horizontal"}
          variant="primaryVertical"
          gap={0}
          height={isDesktop ? height : "auto"}>
          {Steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<Circle bg="#004CFC" size={"30%"} />}
                  active={<Circle bg="#004CFC" size={"60%"} />}
                />
              </StepIndicator>

              {isDesktop && (
                <Box flexShrink="0">
                  <StepTitle>{step.title}</StepTitle>
                </Box>
              )}

              <StepSeparator />
            </Step>
          ))}
        </Stepper>
      </VStack>
    </ResponsiveCard>
  )
}

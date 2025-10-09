"use client"
import { Box, Card, Circle, Heading, Steps, VStack } from "@chakra-ui/react"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useBreakpoints } from "../../../../../hooks/useBreakpoints"
export const CastAllocationVoteStepperCard = () => {
  const { isDesktop } = useBreakpoints()
  const { t } = useTranslation()
  const pathname = usePathname()
  const params = useParams()
  const steps = useMemo(
    () => [
      { key: "selectApps", title: t("Select Apps"), pathnames: ["/rounds/:roundId/vote"] },
      { key: "AssignPercentages", title: t("Assign percentages"), pathnames: ["/rounds/:roundId/vote/percentages"] },
      { key: "reviewAndConfirm", title: t("Review and confirm"), pathnames: ["/rounds/:roundId/vote/confirm"] },
    ],
    [t],
  )
  const [step, setStep] = useState(1)
  //set active step based on the current pathname
  useEffect(() => {
    const pathPattern = Object.keys(params).reduce(
      (acc, key) => acc.replace(params[key] as string, `:${key}`),
      pathname,
    )
    const step = steps.find(step => step.pathnames?.includes(pathPattern))
    if (step) {
      setStep(steps.indexOf(step))
    }
  }, [pathname, params, setStep, steps])
  const height = useMemo(() => {
    return steps.length * 60
  }, [steps])
  return (
    <Card.Root bg={{ base: "transparent", md: "bg.primary" }} px={{ base: "0", md: "6" }} w="full">
      <VStack gap={4} w="full" align={"flex-start"}>
        {isDesktop && <Heading size="xl">{t("Progress")}</Heading>}
        <Steps.Root
          w="full"
          size="sm"
          step={step}
          onStepChange={e => setStep(e.step)}
          count={steps.length}
          orientation={isDesktop ? "vertical" : "horizontal"}
          variant="primary"
          gap={0}
          height={isDesktop ? height : "auto"}>
          <Steps.List>
            {steps.map((step, index) => (
              <Steps.Item
                key={`cast-vote-step-${step.key}`}
                index={index}
                {...(!isDesktop && {
                  style: {
                    gap: 0,
                  },
                })}>
                <Steps.Indicator>
                  <Steps.Status
                    incomplete={<Circle bg="actions.primary.default" size="0" />}
                    complete={<Circle bg="actions.primary.default" size="2" />}
                    current={<Circle bg="actions.primary.default" size="3" />}
                  />
                </Steps.Indicator>

                {isDesktop && (
                  <Box flexShrink="0">
                    <Steps.Title>{step.title}</Steps.Title>
                  </Box>
                )}

                <Steps.Separator
                  {...(!isDesktop && {
                    style: {
                      marginInlineStart: 0,
                    },
                  })}
                />
              </Steps.Item>
            ))}
          </Steps.List>
        </Steps.Root>
      </VStack>
    </Card.Root>
  )
}

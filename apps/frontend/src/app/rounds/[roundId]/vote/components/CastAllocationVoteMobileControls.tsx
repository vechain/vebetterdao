import { useCastAllocationFormStore } from "@/store"
import { Button, HStack, Text, VStack } from "@chakra-ui/react"
import { UilArrowLeft, UilArrowRight } from "@iconscout/react-unicons"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useMemo, useCallback, useState, useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"

type Step = {
  key: string
  pathnames: string[]
  validate: () =>
    | {
        error: true
        message: string
      }
    | {
        error: false
        route: string
      }
}
export const CastAllocationVoteMobileControls = () => {
  const params = useParams<{ roundId: string }>()
  const pathname = usePathname()
  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()
  const { data } = useCastAllocationFormStore()

  const Steps: Step[] = useMemo(
    () => [
      {
        key: "selectApps",
        pathnames: ["/rounds/:roundId/vote"],
        validate: () => {
          if (!data.length) return { error: true, message: "Please select at least one app" }
          return { error: false, route: `/rounds/${params.roundId}/vote/percentages` }
        },
      },
      {
        key: "selectPercentages",
        pathnames: ["/rounds/:roundId/vote/percentages"],
        validate: () => {
          if (data.some(app => app.rawValue === 0))
            return { error: true, message: "Please assign a percentage to all apps" }
          if (data.reduce((acc, app) => acc + app.rawValue, 0) > 100)
            return { error: true, message: "The total percentage must be 100%" }
          return { error: false, route: `/rounds/${params.roundId}/vote/confirm` }
        },
      },
      {
        key: "confirm",
        pathnames: ["/rounds/:roundId/vote/confirm"],
        validate: () => {
          return { error: false, route: `/rounds/${params.roundId}/vote/confirm` }
        },
      },
    ],
    [data, params.roundId],
  )

  const currentStep = useMemo(() => {
    const pathPattern = pathname.replace(params.roundId, ":roundId")
    return Steps.find(step => step.pathnames.includes(pathPattern))
  }, [Steps, pathname, params.roundId])

  const helperText = useMemo(() => {
    const pathPattern = pathname.replace(params.roundId, ":roundId")

    const currentStep = Steps.find(step => step.pathnames.includes(pathPattern))
    if (!currentStep) return ""

    if (error) return error
    switch (currentStep.key) {
      case "selectApps":
        return <Trans i18nKey={"{{amount}} selected apps"} values={{ amount: data.length }} t={t} />
      case "selectPercentages":
        const totalPercentage = data.reduce((acc, app) => acc + app.rawValue, 0)
        return <Trans i18nKey={"{{amount}}% distributed"} values={{ amount: totalPercentage }} t={t} />
      case "confirm":
        return null
    }
  }, [Steps, pathname, params.roundId, t, data, error])

  useEffect(() => {
    if (!currentStep) return

    const result = currentStep.validate()
    if (result.error) {
      setError(result.message)
      return
    }
    setError(null)
  }, [currentStep])

  const onContinue = useCallback(() => {
    if (!currentStep) return

    const result = currentStep.validate()
    if (result.error) {
      setError(result.message)
      return
    }
    router.push(result.route)
  }, [currentStep, router])

  return (
    <VStack
      w="full"
      spacing={4}
      align="stretch"
      pos="fixed"
      bottom={0}
      left={0}
      p={"16px"}
      bg="#FFFFFF"
      zIndex={2}
      boxShadow={"0px -8px 16px 0px #00000014"}>
      <Text fontSize={"16px"} color={error ? "#C84968" : "#252525"} alignSelf={"center"} fontWeight={600}>
        {helperText}
      </Text>

      <HStack w="full" justify={"space-between"}>
        <Button
          leftIcon={<UilArrowLeft />}
          data-testid="go-back"
          variant="primarySubtle"
          onClick={router.back}
          flex={1}
          rounded={"md"}
          size={"lg"}
          fontSize={"18px"}>
          {t("Go back")}
        </Button>
        <Button
          rightIcon={<UilArrowRight />}
          data-testid="continue"
          variant="primaryAction"
          onClick={onContinue}
          flex={1}
          rounded={"md"}
          size={"lg"}
          fontSize={"18px"}>
          {t("Continue")}
        </Button>
      </HStack>
    </VStack>
  )
}

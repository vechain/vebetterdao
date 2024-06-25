import { Button, Card, CardBody, Grid, GridItem, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { StepCard, StepCardProps } from "@/components/StepCard"
import { useTranslation } from "react-i18next"
import { useCallback, useLayoutEffect } from "react"
import { TFunction } from "i18next"
import { useNewProposalPageGuard } from "../form/hooks/useNewProposalPageGuard"

const Steps: (t: TFunction<"translation", undefined>) => StepCardProps[] = t => [
  {
    stepImageSrc: "/images/sign.svg",
    stepNumber: 1,
    stepTitle: t("Creation"),
    stepDescription: t("Craft your proposal by outlining the information and functions to be executed."),
  },
  {
    stepImageSrc: "/images/handshake.svg",
    stepNumber: 2,
    stepTitle: t("Look for support"),
    stepDescription: t("In order for your proposal to be voted on, it will have to have the support of the community."),
  },

  {
    stepImageSrc: "/images/vote.svg",
    stepNumber: 3,
    stepTitle: t("Voting"),
    stepDescription: t(
      "If your proposal gets funded before the voting session starts, the community will vote to decide if they support or reject your idea.",
    ),
  },
  {
    stepImageSrc: "/images/arrow-right.svg",
    stepNumber: 4,
    stepTitle: t("Execution"),
    stepDescription: t("If your proposal receives enough votes, it will be executed."),
  },
]
export const NewProposalPageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const pageGuardResult = useNewProposalPageGuard()

  const onContinue = useCallback(() => {
    router.push("/proposals/new/type")
  }, [router])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  //redirect the user to the beginning of the form if the required data is missing
  // this happens in case the user tries to access this page directly
  useLayoutEffect(() => {
    if (!pageGuardResult.isVisitAuthorized) {
      router.push(pageGuardResult.redirectPath ?? "/proposals")
    }
  }, [pageGuardResult, router])

  if (!pageGuardResult.isVisitAuthorized) return null

  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]}
      gap={6}
      w="full"
      data-testid="new-proposal-page">
      <GridItem colSpan={2}>
        <Card variant="baseWithBorder">
          <CardBody>
            <VStack spacing={8} align="flex-start">
              <Heading size="lg">{t("Create a new proposal")}</Heading>
              <Text fontSize={"lg"}>
                {t(
                  "Proposals represent your ideas as a valued member of the DAO community, aimed at enhancing or modifying aspects of the ecosystem. Each proposal undergoes a voting process, and upon approval, is brought to life.",
                )}
              </Text>
              <Stack direction={["column"]} w="full" spacing={4}>
                {Steps(t).map(step => (
                  <StepCard
                    {...step}
                    key={step.stepNumber}
                    flex={1}
                    stackProps={{
                      direction: ["column", "column", "row"],
                      alignItems: ["flex-start", "flex-start", "center"],
                    }}
                  />
                ))}
              </Stack>
              <Stack direction={["column", "column", "row"]} w="full" justify={"space-between"} spacing={8}>
                <HStack justify={"flex-end"} spacing={4} flex={1}>
                  <Button data-testid="go-back" variant="primarySubtle" onClick={goBack}>
                    {t("Go back")}
                  </Button>
                  <Button data-testid="continue" variant="primaryAction" onClick={onContinue}>
                    {t("Continue")}
                  </Button>
                </HStack>
              </Stack>
            </VStack>
          </CardBody>
        </Card>
      </GridItem>
      <GridItem colSpan={1}></GridItem>
    </Grid>
  )
}

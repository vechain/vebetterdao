import { Button, Card, Grid, GridItem, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react"
import { TFunction } from "i18next"
import { useRouter } from "next/navigation"
import { useCallback, useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"

import ArrowRightIcon from "@/components/Icons/svg/arrow-right.svg"
import HandshakeIcon from "@/components/Icons/svg/handshake.svg"
import SignIcon from "@/components/Icons/svg/sign.svg"
import VoteIcon from "@/components/Icons/svg/vote.svg"
import { StepCard, StepCardProps } from "@/components/StepCard"

import { ButtonClickProperties, buttonClicked, buttonClickActions } from "../../../../constants/AnalyticsEvents"
import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { useNewProposalPageGuard } from "../form/hooks/useNewProposalPageGuard"

const Steps: (t: TFunction<"translation", undefined>) => StepCardProps[] = t => [
  {
    stepIcon: SignIcon,
    stepNumber: 1,
    stepTitle: t("Creation"),
    stepDescription: t("Craft your proposal by outlining the information and functions to be executed."),
  },
  {
    stepIcon: HandshakeIcon,
    stepNumber: 2,
    stepTitle: t("Look for support"),
    stepDescription: t("In order for your proposal to be voted on, it will have to have the support of the community."),
  },
  {
    stepIcon: VoteIcon,
    stepNumber: 3,
    stepTitle: t("Voting"),
    stepDescription: t(
      "If your proposal gets funded before the voting session starts, the community will vote to decide if they support or reject your idea.",
    ),
  },
  {
    stepIcon: ArrowRightIcon,
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
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CONTINUE_CREATE_PROPOSAL))
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
        <Card.Root variant="primary">
          <Card.Body>
            <VStack gap={[6, 8]} align="flex-start">
              <VStack gap={[4, 6]} align="flex-start">
                <Heading size={["xl", "2xl"]}>{t("Create a new proposal")}</Heading>
                <Text textStyle={["sm", "md"]}>
                  {t(
                    "Proposals represent your ideas as a valued member of the DAO community, aimed at enhancing or modifying aspects of the ecosystem. Each proposal undergoes a voting process, and upon approval, is brought to life.",
                  )}
                </Text>
              </VStack>
              <Stack direction={["column"]} w="full" gap={4}>
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
              <Stack direction={["column", "column", "row"]} w="full" justify={"space-between"} gap={8}>
                <HStack justify={"flex-end"} gap={4} flex={1}>
                  <Button data-testid="go-back" variant="link" onClick={router.back}>
                    {t("Go back")}
                  </Button>
                  <Button data-testid="continue" variant="primary" onClick={onContinue}>
                    {t("Continue")}
                  </Button>
                </HStack>
              </Stack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </GridItem>
      <GridItem colSpan={1}></GridItem>
    </Grid>
  )
}

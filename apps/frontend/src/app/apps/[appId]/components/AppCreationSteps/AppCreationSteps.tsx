import { useEndorsementScoreThreshold, useIsAppUnendorsed } from "@/api"
import { XAppsCreationSteps, XAppsCreationStepStatus } from "@/types/appDetails"
import { Box, Card, Grid, Heading, HStack, Icon, Link, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { Trans, useTranslation } from "react-i18next"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { StepBoxes } from "./components/StepBoxes"
import { useRouter } from "next/navigation"

export const AppCreationSteps = () => {
  const { t } = useTranslation()
  const router = useRouter()

  const { app } = useCurrentAppInfo()
  const { data: isAppUnendorsed, isLoading } = useIsAppUnendorsed(app?.id ?? "")
  const { data: endorsementScoreThreshold } = useEndorsementScoreThreshold()
  const currentStep = isAppUnendorsed ? XAppsCreationSteps.ENDORSEMENT : XAppsCreationSteps.ALLOCATION

  const getXAppsCreationStepStatus = (step: XAppsCreationSteps): XAppsCreationStepStatus => {
    if (step < currentStep) return XAppsCreationStepStatus.COMPLETED
    if (step === currentStep) return XAppsCreationStepStatus.ACTIVE
    return XAppsCreationStepStatus.PENDING
  }

  const redirectToEditPage = () => {
    router.push(`/apps/${app?.id}/edit`)
  }

  return (
    <Box>
      <Card.Root>
        <Card.Body>
          <VStack gap={8} align="flex-start">
            <HStack w="full">
              <HStack w="full" justify="start">
                <Heading size="3xl">{t("Your App is almost ready!")}</Heading>
              </HStack>
              <HStack w="full" justify="end" alignItems="center" display={{ base: "none", md: "flex" }}>
                <Icon as={UilInfoCircle} color="rgba(0, 76, 252, 1)" />
                <Link color="#004CFC" href={"https://docs.vebetterdao.org/developer-guides/submit-x2earn-app"}>
                  {t("Know more about Apps")}
                </Link>
              </HStack>
            </HStack>
            <Text fontSize="md" color="#6A6A6A">
              {t(
                "Before adding your App to the public listing and seeing stats and updates, it has to go through these three steps.",
              )}
              <Trans
                i18nKey="You can fill the App information while waiting!"
                components={{
                  Link: <Link onClick={redirectToEditPage} color="#004CFC" />,
                }}
              />
            </Text>

            <Box w="full" maxW={"100%"} overflowX="auto">
              <Skeleton loading={isLoading}>
                <Grid gridTemplateColumns={["repeat(1,  1fr)", "repeat(3,  1fr)"]} gap={4} w="full">
                  <StepBoxes
                    stepText={t("STEP {{value}}", { value: XAppsCreationSteps.SUBMISSION + 1 })}
                    title={t("App submission")}
                    type={XAppsCreationSteps.SUBMISSION}
                    status={getXAppsCreationStepStatus(XAppsCreationSteps.SUBMISSION)}
                    description={t(
                      "Submit your app into the ecosystem with all the necessary information, including logo, creator bio, and social media links.",
                    )}
                  />
                  <StepBoxes
                    stepText={t("STEP {{value}}", { value: XAppsCreationSteps.ENDORSEMENT + 1 })}
                    title={t("Endorsement")}
                    type={XAppsCreationSteps.ENDORSEMENT}
                    status={getXAppsCreationStepStatus(XAppsCreationSteps.ENDORSEMENT)}
                    description={t(
                      "X Node Holders will use their NFTs to endorse your dApp. Once it reaches {{value}} points, it becomes eligible for allocations.",
                      { value: endorsementScoreThreshold },
                    )}
                  />
                  <StepBoxes
                    stepText={t("STEP {{value}}", { value: XAppsCreationSteps.ALLOCATION + 1 })}
                    title={t("Allocation voting")}
                    type={XAppsCreationSteps.ALLOCATION}
                    status={getXAppsCreationStepStatus(XAppsCreationSteps.ALLOCATION)}
                    description={t(
                      "The allocation rounds determine the resources and support your dApp receives from the ecosystem community.",
                    )}
                  />
                </Grid>
              </Skeleton>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Box>
  )
}

import { useEndorsementScoreThreshold, useIsAppUnendorsed } from "@/api"
import { Handshake } from "@/components"
import { SignIcon } from "@/components/Icons/SignIcon"
import { VoteCheckmarkIcon } from "@/components/Icons/VoteCheckmarkIcon"
import { XAppsCreationSteps, XAppsCreationStepStatus } from "@/types/appDetails"
import {
  Box,
  Card,
  CardBody,
  Circle,
  Grid,
  Heading,
  HStack,
  Icon,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { UilCheck, UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"

type StepBoxesProps = {
  title: string
  description: string
  type: XAppsCreationSteps
  status: XAppsCreationStepStatus
  stepText: string
}
const statusIcon = {
  [XAppsCreationStepStatus.PENDING]: null,
  [XAppsCreationStepStatus.ACTIVE]: <Circle size="80%" bg="#004CFC" />,
  [XAppsCreationStepStatus.COMPLETED]: <UilCheck size={20} color="#004CFC" />,
}

const stepIcon = {
  [XAppsCreationSteps.SUBMISSION]: SignIcon,
  [XAppsCreationSteps.ENDORSEMENT]: Handshake,
  [XAppsCreationSteps.ALLOCATION]: VoteCheckmarkIcon,
}

const StepBoxes = ({
  stepText,
  title,
  type,
  description,
  status = XAppsCreationStepStatus.PENDING,
}: StepBoxesProps) => {
  const borderColor = status === XAppsCreationStepStatus.ACTIVE ? "#004CFC" : "transparent"
  const IconComponent = stepIcon[type]
  const iconColor = status === XAppsCreationStepStatus.COMPLETED ? "#004CFC" : "#000000"

  return (
    <Stack
      minW={["60vw", "45vw", "15vw", "5vw"]}
      w="full"
      h="full"
      position="relative"
      borderRadius="24px"
      borderWidth="2px"
      borderColor={borderColor}>
      <Stack
        position="absolute"
        borderRadius="25px"
        borderWidth="2px"
        borderColor="#004CFC"
        top={4}
        right={4}
        w="25px"
        h="25px"
        display="flex"
        alignItems="center"
        justifyContent="center">
        {statusIcon[status]}
      </Stack>
      <Stack
        w="full"
        h="full"
        p={3}
        backgroundColor={"#F7F7F7"}
        borderRadius="24px"
        opacity={status === XAppsCreationStepStatus.PENDING ? 0.5 : 1}>
        <HStack w="full" h="full" alignItems="center">
          <IconComponent size={124} color={iconColor} />
        </HStack>
        <VStack alignItems="start" w="full">
          <Text fontSize="12px" color="#6A6A6A" lineHeight={"1px"}>
            {stepText}
          </Text>
          <Heading size={["md", "sm", "sm"]}>{title}</Heading>
        </VStack>
        <Text fontSize="14px" color="#6A6A6A" w="full">
          {description}
        </Text>
      </Stack>
    </Stack>
  )
}

export const AppCreationSteps = () => {
  const { t } = useTranslation()

  const { app } = useCurrentAppInfo()
  const { data: isAppUnendorsed, isLoading } = useIsAppUnendorsed(app?.id ?? "")
  const { data: endorsementScoreThreshold } = useEndorsementScoreThreshold()
  const currentStep = isAppUnendorsed ? XAppsCreationSteps.ENDORSEMENT : XAppsCreationSteps.ALLOCATION

  const getXAppsCreationStepStatus = (step: XAppsCreationSteps): XAppsCreationStepStatus => {
    if (step < currentStep) return XAppsCreationStepStatus.COMPLETED
    if (step === currentStep) return XAppsCreationStepStatus.ACTIVE
    return XAppsCreationStepStatus.PENDING
  }

  return (
    <Box>
      <Card>
        <CardBody>
          <VStack spacing={8} align="flex-start">
            <HStack w="full">
              <HStack w="full" justify="start">
                <Heading size="lg">{t("Your App is almost ready!")}</Heading>
              </HStack>
              <HStack w="full" justify="end" alignItems="center" display={{ base: "none", md: "flex" }}>
                <Icon as={UilInfoCircle} color="rgba(0, 76, 252, 1)" />
                <Text color="rgba(0, 76, 252, 1)">{t("Know more about Apps")}</Text>
              </HStack>
            </HStack>
            <Text fontSize="md" color="#6A6A6A">
              {t(
                "Before adding your App to the public listing and seeing stats and updates, it has to go through these three steps. You can",
              )}
              <Text as="span" color="rgba(0, 76, 252, 1)">
                {" "}
                {t("fill the App information")}{" "}
              </Text>
              {t("while waiting!")}
            </Text>

            <Box w="full" maxW={"100%"} overflowX="auto">
              <Skeleton isLoaded={!isLoading}>
                <Grid gridTemplateColumns="repeat(3,  1fr)" gap={4} w="full">
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
        </CardBody>
      </Card>
    </Box>
  )
}

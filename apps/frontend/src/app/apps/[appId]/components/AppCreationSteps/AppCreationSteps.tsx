import { Handshake } from "@/components"
import { SignIcon } from "@/components/Icons/SignIcon"
import { VoteCheckmarkIcon } from "@/components/Icons/VoteCheckmarkIcon"
import { Box, Card, CardBody, Circle, Heading, HStack, Icon, Text, useColorModeValue, VStack } from "@chakra-ui/react"
import { UilCheck, UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export enum XAppsSteps {
  SUBMISSION,
  ENDORSEMENT,
  ALLOCATION,
}
type AppCreationStepsProps = {
  currentStep: XAppsSteps
}
enum StepStatus {
  COMPLETED = "COMPLETED",
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
}

type StepBoxesProps = {
  stepText: string
  title: string
  type: XAppsSteps
  description: string
  status: StepStatus
}
const statusIcon = {
  [StepStatus.PENDING]: null,
  [StepStatus.ACTIVE]: <Circle size="80%" bg="#004CFC" />,
  [StepStatus.COMPLETED]: <UilCheck size={20} color="#004CFC" />,
}

const stepIcon = {
  [XAppsSteps.SUBMISSION]: SignIcon,
  [XAppsSteps.ENDORSEMENT]: Handshake,
  [XAppsSteps.ALLOCATION]: VoteCheckmarkIcon,
}

const StepBoxes = ({ stepText, title, type, description, status = StepStatus.PENDING }: StepBoxesProps) => {
  const cardBackgroundColor = useColorModeValue("#F7F7F7", "#131313")
  const borderColor = status === StepStatus.ACTIVE ? "#004CFC" : "transparent"
  const IconComponent = stepIcon[type]
  const iconColor = status === StepStatus.COMPLETED ? "#004CFC" : "#000000"

  return (
    <Box w="full" h="full" position="relative" borderRadius="24px" borderWidth="2px" borderColor={borderColor}>
      <Box
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
      </Box>
      <VStack
        w="full"
        h="full"
        borderRadius="24px"
        backgroundColor={cardBackgroundColor}
        opacity={status === StepStatus.PENDING ? 0.5 : 1}
        py={4}
        px={6}>
        <HStack w="full" alignItems="center">
          <IconComponent size={124} color={iconColor} />
        </HStack>
        <VStack alignItems="start" w="full">
          <Text fontSize="12px" color="#6A6A6A" lineHeight={"1px"}>
            {stepText}
          </Text>
          <Text fontSize="20px" fontWeight={800} color="#252525">
            {title}
          </Text>
        </VStack>
        <Text fontSize="14px" color="#6A6A6A" w="full">
          {description}
        </Text>
      </VStack>
    </Box>
  )
}

export const AppCreationSteps = ({ currentStep }: AppCreationStepsProps) => {
  const { t } = useTranslation()
  const getStepStatus = (step: number): StepStatus => {
    if (step < currentStep) return StepStatus.COMPLETED
    if (step === currentStep) return StepStatus.ACTIVE
    return StepStatus.PENDING
  }
  return (
    <Card variant="base">
      <CardBody>
        <VStack w="full" pb={8}>
          <VStack w="full" align="start">
            <HStack w="full">
              <HStack w="full" justify="start">
                <Heading size="lg">{t("Your App is almost ready!")}</Heading>
              </HStack>
              <HStack w="full" justify={"end"} alignItems={"center"}>
                <Icon as={UilInfoCircle} color="rgba(0, 76, 252, 1)" />
                <Text color="rgba(0, 76, 252, 1)">{t("Know more about Apps")}</Text>
              </HStack>
            </HStack>
            <Text fontSize="md" color="#6A6A6A">
              {t(
                "Before adding your App to the public listing and seeing stats and updates, it has to go through these three steps. You can",
              )}
              <Text as="span" color="rgba(0, 76, 252, 1)">
                {t("fill the App information")}
              </Text>
              {t("while waiting!")}
            </Text>
          </VStack>
        </VStack>
        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={4} w="full">
          <StepBoxes
            stepText={t("STEP {{value}}", { value: 1 })}
            title={t("App submission")}
            type={XAppsSteps.SUBMISSION}
            status={getStepStatus(XAppsSteps.SUBMISSION)}
            description={t(
              "Submit your app into the ecosystem with all the necessary information, including logo, creator bio, and social media links.",
            )}
          />
          <StepBoxes
            stepText={t("STEP {{value}}", { value: 2 })}
            title={t("Endorsement")}
            type={XAppsSteps.ENDORSEMENT}
            status={getStepStatus(XAppsSteps.ENDORSEMENT)}
            description={t(
              "X Node Holders will use their NFTs to endorse your dApp. Once it reaches 100 points, it becomes eligible for allocations.",
            )}
          />
          <StepBoxes
            stepText={t("STEP {{value}}", { value: 3 })}
            title={t("Allocation voting")}
            type={XAppsSteps.ALLOCATION}
            status={getStepStatus(XAppsSteps.ALLOCATION)}
            description={t(
              "The allocation rounds determine the resources and support your dApp receives from the ecosystem community.",
            )}
          />
        </Box>
      </CardBody>
    </Card>
  )
}

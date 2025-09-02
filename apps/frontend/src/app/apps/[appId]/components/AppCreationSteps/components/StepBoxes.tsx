import { Handshake, SignIcon, VoteCheckmarkIcon } from "@/components"
import { XAppsCreationSteps, XAppsCreationStepStatus } from "@/types"
import { Circle, Heading, HStack, Stack, Text, VStack } from "@chakra-ui/react"
import { UilCheck } from "@iconscout/react-unicons"

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

export const StepBoxes = ({
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
          <Text textStyle="xs" color="text.subtle">
            {stepText}
          </Text>
          <Heading size={["md", "sm", "sm"]}>{title}</Heading>
        </VStack>
        <Text textStyle="sm" color="text.subtle" w="full">
          {description}
        </Text>
      </Stack>
    </Stack>
  )
}

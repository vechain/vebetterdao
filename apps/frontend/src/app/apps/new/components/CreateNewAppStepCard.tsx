import { Box, Card, CardBody, Heading, Image, Text, VStack } from "@chakra-ui/react"

export type Props = {
  stepImageSrc: string
  stepNumber: number
  stepTitle: string
  stepDescription: string
}
export const CreateNewAppStepCard = ({ stepImageSrc, stepNumber, stepTitle, stepDescription }: Props) => {
  return (
    <Card variant="filled" rounded={"3xl"}>
      <CardBody>
        <VStack spacing={4} align={"flex-start"}>
          <Image src={stepImageSrc} boxSize={32} alignSelf={"center"} />
          <Box>
            <Text textTransform={"uppercase"} fontWeight={600}>
              Step {stepNumber}
            </Text>
            <Heading size="md">{stepTitle}</Heading>
          </Box>
          <Text>{stepDescription}</Text>
        </VStack>
      </CardBody>
    </Card>
  )
}

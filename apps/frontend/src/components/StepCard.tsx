import { Box, Card, CardBody, CardProps, Heading, Image, Text, VStack } from "@chakra-ui/react"

export type StepCardProps = {
  stepImageSrc: string
  stepNumber: number
  stepTitle: string
  stepDescription: string
} & CardProps
export const StepCard: React.FC<StepCardProps> = ({
  stepImageSrc,
  stepNumber,
  stepTitle,
  stepDescription,
  ...props
}) => {
  return (
    <Card variant="filled" rounded={"3xl"} {...props}>
      <CardBody>
        <VStack spacing={4} align={"flex-start"}>
          <Image src={stepImageSrc} boxSize={32} />
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

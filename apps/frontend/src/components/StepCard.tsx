import { Box, Card, CardBody, CardProps, Heading, Image, Stack, StackProps, Text, VStack } from "@chakra-ui/react"

export type StepCardProps = {
  stepImageSrc: string
  stepNumber: number
  stepTitle: string
  stepDescription: string
  stackProps?: StackProps
} & CardProps
export const StepCard: React.FC<StepCardProps> = ({
  stepImageSrc,
  stepNumber,
  stepTitle,
  stepDescription,
  stackProps = {},
  ...props
}) => {
  return (
    <Card variant="filled" rounded={"3xl"} {...props}>
      <CardBody>
        <Stack spacing={4} align={"flex-start"} {...stackProps}>
          <Image src={stepImageSrc} boxSize={32} />
          <Box>
            <Text textTransform={"uppercase"} fontWeight={600}>
              Step {stepNumber}
            </Text>
            <Heading size="md">{stepTitle}</Heading>
            <Text mt={2}>{stepDescription}</Text>
          </Box>
        </Stack>
      </CardBody>
    </Card>
  )
}

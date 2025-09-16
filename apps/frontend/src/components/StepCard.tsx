import { Box, Card, CardRootProps, Heading, Image, Stack, StackProps, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export type StepCardProps = {
  stepImageSrc: string
  stepNumber: number
  stepTitle: string
  stepDescription: string
  stackProps?: StackProps
} & CardRootProps
export const StepCard: React.FC<StepCardProps> = ({
  stepImageSrc,
  stepNumber,
  stepTitle,
  stepDescription,
  stackProps = {},
  ...props
}) => {
  const { t } = useTranslation()
  return (
    <Card.Root variant="primary" rounded={"3xl"} {...props}>
      <Card.Body>
        <Stack gap={4} align={"flex-start"} {...stackProps}>
          <Image src={stepImageSrc} boxSize={32} alt={`step-${stepNumber}-image`} />
          <Box>
            <Text textTransform={"uppercase"} color="gray.500">
              {t("Step {{number}}", { number: stepNumber })}
            </Text>
            <Heading size={["lg", "xl"]}>{t(stepTitle as any)}</Heading>
            <Text mt={2} textStyle={["sm", "md"]}>
              {t(stepDescription as any)}
            </Text>
          </Box>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}

import { Box, Card, CardRootProps, Heading, Icon, Stack, StackProps, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export type StepCardProps = {
  stepIcon: React.ElementType
  stepNumber: number
  stepTitle: string
  stepDescription: string
  stackProps?: StackProps
} & CardRootProps
export const StepCard: React.FC<StepCardProps> = ({
  stepIcon,
  stepNumber,
  stepTitle,
  stepDescription,
  stackProps = {},
  ...props
}) => {
  const { t } = useTranslation()
  return (
    <Card.Root variant="filled" rounded={"3xl"} {...props}>
      <Card.Body>
        <Stack gap={4} align={"flex-start"} {...stackProps}>
          <Icon as={stepIcon} boxSize={32} color="brand.primary" />
          <Box>
            <Text textTransform={"uppercase"} fontWeight={400} color="gray.500">
              {t("Step {{number}}", { number: stepNumber })}
            </Text>
            <Heading size={["lg", "xl"]}>{t(stepTitle as any)}</Heading>
            <Text mt={2} fontSize={["sm", "md"]}>
              {t(stepDescription as any)}
            </Text>
          </Box>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}

import { Badge, Card, Icon, Text } from "@chakra-ui/react"
import { Flash } from "iconoir-react"
import { useTranslation } from "react-i18next"

interface VotingWeightDisplayProps {
  formattedVotingWeight: string
}

/**
 * Used in transaction modals to show the voting power being used
 */
export const VotingWeightDisplay = ({ formattedVotingWeight }: VotingWeightDisplayProps) => {
  const { t } = useTranslation()

  return (
    <Card.Root
      key={formattedVotingWeight}
      variant="subtle"
      mt="4"
      p={4}
      bg="bg.secondary"
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      gap="2">
      <Text textStyle="sm" color="text.subtle">
        {t("You voted with")}
      </Text>
      <Badge
        variant="outline"
        rounded="md"
        size="lg"
        borderWidth="2px"
        borderColor="status.positive.primary"
        color="status.positive.primary"
        px={3}
        py={1}
        textStyle="md">
        <Icon as={Flash} color="status.positive.primary" boxSize="5" />
        {formattedVotingWeight}
      </Badge>
    </Card.Root>
  )
}

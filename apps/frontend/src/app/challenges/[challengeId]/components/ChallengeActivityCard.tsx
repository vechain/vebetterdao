import { Card, Heading, HStack, Icon } from "@chakra-ui/react"
import { Activity } from "iconoir-react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/ui/empty-state"

export const ChallengeActivityCard = () => {
  const { t } = useTranslation()

  return (
    <Card.Root
      variant="primary"
      p={{ base: "4", md: "6" }}
      height="max-content"
      minHeight={{ base: "fit-content", md: "500px" }}>
      <Card.Header as={HStack} gap="2" pb={{ base: "5", md: "6" }}>
        <Icon as={Activity} boxSize="5" color="icon.default" />
        <Heading size={{ base: "md", md: "lg" }} fontWeight="semibold">
          {t("Activity")}
        </Heading>
      </Card.Header>
      <Card.Body>
        <EmptyState bg="transparent" flex={1} display="flex" justifyContent="center" title={t("No activity yet")} />
      </Card.Body>
    </Card.Root>
  )
}

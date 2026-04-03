import { Card, HStack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuUsers } from "react-icons/lu"

type Props = {
  isDelegated?: boolean
}

export const NavigatorStatusBanner = ({ isDelegated }: Props) => {
  const { t } = useTranslation()

  if (isDelegated) {
    return (
      <Card.Root variant="outline" borderColor="blue.500" bg="blue.50" _dark={{ bg: "blue.900/20" }}>
        <Card.Body py={3}>
          <HStack gap={3}>
            <LuUsers size={20} color="var(--chakra-colors-blue-500)" />
            <Text textStyle="sm" fontWeight="semibold">
              {t("You are delegated to a Navigator")}
            </Text>
          </HStack>
        </Card.Body>
      </Card.Root>
    )
  }

  return null
}

import { Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  title: string
  description: string
  onManage: () => void
  icon?: ReactNode
}

export const AdminSettingSection = ({ title, description, onManage, icon }: Props) => {
  const { t } = useTranslation()

  return (
    <HStack justify="space-between" align="center" py={4} gap={4}>
      <HStack gap={4} align="start" flex={1}>
        {icon}
        <VStack align="stretch" gap={1}>
          <Heading size="md">{title}</Heading>
          <Text textStyle="sm" color="text.subtle">
            {description}
          </Text>
        </VStack>
      </HStack>
      <Button variant="outline" size="sm" onClick={onManage} flexShrink={0}>
        {t("Manage")}
      </Button>
    </HStack>
  )
}

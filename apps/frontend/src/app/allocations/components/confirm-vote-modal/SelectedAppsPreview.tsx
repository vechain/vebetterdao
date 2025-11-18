"use client"

import { Badge, Box, Card, Circle, Float, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { Check } from "iconoir-react"
import { useTranslation } from "react-i18next"

import { AppImage } from "@/components/AppImage/AppImage"

import type { AppWithVotes } from "../../lib/data"

interface SelectedAppsPreviewProps {
  apps: AppWithVotes[]
}

export const SelectedAppsPreview = ({ apps }: SelectedAppsPreviewProps) => {
  const { t } = useTranslation()
  return (
    <VStack gap={2} align="stretch">
      <HStack justify="space-between">
        <Text textStyle="sm" fontWeight="semibold">
          {t("Selected apps")}
        </Text>
        <Badge variant="neutral" size="sm" rounded="sm">
          {apps.length} {apps.length === 1 ? t("app") : t("apps")}
        </Badge>
      </HStack>

      <Card.Root
        variant="outline"
        p={4}
        border="sm"
        borderColor="border.secondary"
        display="flex"
        justifyContent="center"
        gap="3"
        flexDirection="row"
        overflowX="auto">
        {apps.map(app => (
          <Box key={app.id} display="inline-block" pos="relative">
            <AppImage appId={app.id} boxSize="48px" borderRadius="lg" flexShrink={0} />
            <Float placement="top-end">
              <Circle background="status.positive.primary" border="sm" borderColor="status.positive.subtle">
                <Icon as={Check} color="white" />
              </Circle>
            </Float>
          </Box>
        ))}
      </Card.Root>
    </VStack>
  )
}

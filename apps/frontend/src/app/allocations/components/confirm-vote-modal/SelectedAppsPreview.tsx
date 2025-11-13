"use client"

import { Box, Card, Circle, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { Check } from "iconoir-react"
import { useTranslation } from "react-i18next"

import { AppImage } from "@/components/AppImage/AppImage"

import type { AppWithVotes } from "../../page"

interface SelectedAppsPreviewProps {
  apps: AppWithVotes[]
}

export const SelectedAppsPreview = ({ apps }: SelectedAppsPreviewProps) => {
  const { t } = useTranslation()
  return (
    <VStack gap={3} alignItems="stretch">
      <HStack justifyContent="space-between">
        <Text textStyle="md" fontWeight="semibold">
          {t("Selected apps")}
        </Text>
        <Text color="text.subtle" textStyle="sm" fontWeight="normal">
          {apps.length} {apps.length === 1 ? t("app") : t("apps")}
        </Text>
      </HStack>

      <Card.Root variant="subtle" p={6} display="flex" justifyContent="center" alignItems="center">
        <HStack gap={3} justifyContent="center" flexWrap="wrap">
          {apps.map(app => (
            <Box key={app.id} position="relative">
              <AppImage appId={app.id} boxSize="64px" borderRadius="lg" />
              <Circle
                position="absolute"
                top="-1"
                right="-1"
                size="20px"
                bg="green.500"
                borderWidth="2px"
                borderColor="white">
                <Icon as={Check} boxSize="12px" color="white" strokeWidth="3" />
              </Circle>
            </Box>
          ))}
        </HStack>
      </Card.Root>
    </VStack>
  )
}

"use client"

import { Box, Circle, HStack, Icon, Text, VStack } from "@chakra-ui/react"
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
      <Text textStyle="md" fontWeight="semibold" display="flex" justifyContent="space-between">
        <span>{t("Selected apps")}</span>
        <Text as="span" color="text.subtle" textStyle="sm" fontWeight="normal">
          {apps.length} {apps.length === 1 ? t("app") : t("apps")}
        </Text>
      </Text>

      <Box
        bg="bg.subtle"
        borderRadius="xl"
        p={6}
        borderWidth="1px"
        borderColor="border.primary"
        display="flex"
        justifyContent="center"
        alignItems="center">
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
      </Box>
    </VStack>
  )
}

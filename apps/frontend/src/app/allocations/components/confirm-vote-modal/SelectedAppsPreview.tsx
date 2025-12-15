"use client"

import { Badge, Box, Button, Card, Circle, Float, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { Check } from "iconoir-react"
import { useTranslation } from "react-i18next"

import { AppImage } from "@/components/AppImage/AppImage"

import type { AppWithVotes } from "../../lib/data"

interface SelectedAppsPreviewProps {
  apps: AppWithVotes[]
  onEditSelection?: () => void
}

export const SelectedAppsPreview = ({ apps, onEditSelection }: SelectedAppsPreviewProps) => {
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
        flexDirection="column"
        alignItems="center"
        overflowX="auto">
        <HStack
          gap="2"
          overflowX="auto"
          py={2}
          pb={onEditSelection ? 4 : 2}
          borderBottom={onEditSelection ? "1px solid" : "none"}
          borderColor="border.secondary"
          w="full"
          justifyContent="center">
          {apps.map(app => (
            <Box key={app.id} display="inline-block" pos="relative">
              <AppImage appId={app.id} appLogo={app.metadata?.logo} boxSize="11" borderRadius="lg" flexShrink={0} />
              <Float placement="top-end" offset="0">
                <Circle
                  size="4.5"
                  background="status.positive.primary"
                  border="sm"
                  borderColor="status.positive.subtle">
                  <Icon as={Check} color="white" boxSize="3" />
                </Circle>
              </Float>
            </Box>
          ))}
        </HStack>
        {onEditSelection && (
          <Button
            variant="link"
            size="sm"
            onClick={onEditSelection}
            fontWeight="semibold"
            color="text.link"
            px={2}
            py={2}
            borderRadius="full">
            {t("Edit selection")}
          </Button>
        )}
      </Card.Root>
    </VStack>
  )
}

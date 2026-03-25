"use client"

import { Alert, Button, HStack, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

export const PendingInvitationsBanner = ({ count }: { count: number }) => {
  const { t } = useTranslation()

  if (count === 0) return null

  return (
    <Alert.Root status="warning">
      <HStack align="flex-start" justify="space-between" w="full" gap="4" flexWrap="wrap">
        <VStack align="start" gap="1">
          <Alert.Title>{t("You have pending challenge invitations")}</Alert.Title>
          <Alert.Description>
            <Text textStyle="sm">{t("{{count}} invitations still need a response", { count })}</Text>
          </Alert.Description>
        </VStack>
        <Button asChild size="sm" variant="solid">
          <NextLink href="/challenges/invited">{t("Review invites")}</NextLink>
        </Button>
      </HStack>
    </Alert.Root>
  )
}

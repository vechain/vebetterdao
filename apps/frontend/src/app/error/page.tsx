"use client"
import { Heading, VStack, Button, Text } from "@chakra-ui/react"
import NextLink from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"

export default function AuthErrorPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  return (
    <VStack w="full" gap={4} py={10}>
      <Heading textAlign="center">{t("Authentication failed")}</Heading>
      <Text color="text.subtle" textAlign="center" maxW="md">
        {t("Something went wrong while connecting your account. Please try again.")}
      </Text>
      <Button asChild variant="primary" my="20px">
        <NextLink href={callbackUrl}>{t("Go back and retry")}</NextLink>
      </Button>
    </VStack>
  )
}

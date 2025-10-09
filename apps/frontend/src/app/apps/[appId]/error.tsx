"use client"
import { Heading, Image, VStack, Button, Text } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
interface CustomErrorProps {
  error: Error
}
export default function CustomError({ error }: CustomErrorProps) {
  const { t } = useTranslation()
  return (
    <VStack w={"full"}>
      <Image boxSize={"190px"} src="/assets/icons/error-to-define.svg" alt="error" />
      <Text color="text.subtle">{t("{{value}}", { value: error })}</Text>
      <Heading textAlign={"center"}>{t("Something went wrong. Let’s try that again!")}</Heading>
      <Button asChild variant={"primary"} my={"20px"}>
        <NextLink href="/">{t("Go back home")}</NextLink>
      </Button>
    </VStack>
  )
}

"use client"

import { Heading, Image, VStack, Button, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"

interface CustomErrorProps {
  error: Error
}

export default function CustomError({ error }: CustomErrorProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const goToHomePage = () => {
    router.push("/")
  }

  return (
    <VStack w={"full"}>
      <Image boxSize={"190px"} src="/assets/icons/error-to-define.svg" alt="error" />
      <Text color="#6A6A6A">{t("{{value}}", { value: error })}</Text>
      <Heading textAlign={"center"}>{t("Something went wrong. Let’s try that again!")}</Heading>
      <Button variant={"primaryAction"} onClick={goToHomePage} my={"20px"}>
        {t("Go back home")}
      </Button>
    </VStack>
  )
}

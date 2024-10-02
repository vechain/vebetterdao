"use client"

import { Heading, Image, VStack, Button, Text, Box } from "@chakra-ui/react"
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

  console.log("error", error)

  return (
    <VStack h="full" alignItems={"left"}>
      <Box py={"7%"}>
        <Image src="/images/error-to-define.svg" alt="error" />
      </Box>
      <VStack alignItems={"left"} w={["100%", "100%", "100%", "50%"]}>
        <Text color="#6A6A6A">{t("{{value}}", { value: error })}</Text>
        <Heading>{t("Something went wrong. Let’s try that again!")}</Heading>
        <Button w={"150px"} variant={"primaryAction"} onClick={goToHomePage} my={"20px"}>
          {t("Go back home")}
        </Button>
      </VStack>
    </VStack>
  )
}

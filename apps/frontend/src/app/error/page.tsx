"use client"

import { Heading, Image, VStack, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"

export default function CustomError() {
  const { t } = useTranslation()
  const router = useRouter()

  const goToHomePage = () => {
    router.push("/")
  }

  return (
    <VStack w={"full"}>
      <Image boxSize={"190px"} src="/images/error-to-define.svg" alt="error" />
      <Heading textAlign={"center"}>{t("Something went wrong. Let’s try that again!")}</Heading>
      <Button variant={"primaryAction"} onClick={goToHomePage} my={"20px"}>
        {t("Go back home")}
      </Button>
    </VStack>
  )
}

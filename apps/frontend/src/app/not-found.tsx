"use client"

import { Heading, Image, VStack, Button, Text, Box } from "@chakra-ui/react"
import React from "react"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"

export default function Custom404() {
  const { t } = useTranslation()
  const router = useRouter()

  const goToHomePage = () => {
    router.push("/")
  }

  return (
    <VStack h="full" alignItems={"left"}>
      <Box py={"7%"}>
        <Image src="/images/not-found-404.svg" alt="404" />
      </Box>
      <VStack alignItems={"left"} w={["100%", "100%", "100%", "50%"]}>
        <Text color="#6A6A6A">{t("Error 404")}</Text>
        <Heading>{t("We can't find what you're looking for. Let's head back and try again!")}</Heading>
        <Button w={"150px"} variant={"primaryAction"} onClick={goToHomePage} my={"20px"}>
          {t("Go back home")}
        </Button>
      </VStack>
    </VStack>
  )
}

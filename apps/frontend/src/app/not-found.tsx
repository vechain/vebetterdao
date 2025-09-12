"use client"

import { Heading, Image, VStack, Button, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"

export default function Custom404() {
  const { t } = useTranslation()
  const router = useRouter()

  const goToHomePage = () => {
    router.push("/")
  }

  return (
    <VStack w={"full"}>
      <Image boxSize={"190px"} src="/assets/icons/not-found-404.svg" alt="404" />
      <Text color="text.subtle">{t("Error 404")}</Text>
      <Heading textAlign={"center"} width={["100%", "50%"]}>
        {t("We can't find what you're looking for. Let's head back and try again!")}
      </Heading>
      <Button variant={"primary"} onClick={goToHomePage} my={"20px"}>
        {t("Go back home")}
      </Button>
    </VStack>
  )
}

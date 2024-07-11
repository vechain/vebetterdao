"use client"
import { HStack, Text, useColorModeValue } from "@chakra-ui/react"
import Image from "next/image"
import React from "react"
import { useTranslation } from "react-i18next"

export const VeBetterDaoLogo: React.FC = () => {
  const lightModeUrl = "/images/logo/vebetter_light.svg"
  const darkModeUrl = "/images/logo/vebetter_dark.svg"
  const logoUrl = useColorModeValue(lightModeUrl, darkModeUrl)
  const { t } = useTranslation()

  //Priority is set to true to prevent the logo from being lazy loaded and FOC
  return (
    <HStack spacing={1} align={"flex-start"}>
      <Image height={"100"} width={"100"} alt="VeBetterDAO logo" src={logoUrl} priority={true} />
      <Text fontSize="2xs" fontWeight="bold" color="primary.500">
        {t("DAO")}
      </Text>
    </HStack>
  )
}

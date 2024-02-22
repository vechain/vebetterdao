"use client"
import { HStack, Text, useColorModeValue } from "@chakra-ui/react"
import Image from "next/image"
import React from "react"

export const VeBetterDaoLogo: React.FC = () => {
  //TODO: Add dark mode logo
  const lightModeUrl = "/images/logo/vebetter_light.svg"
  const darkModeUrl = "/images/logo/vebetter_dark.svg"
  const logoUrl = useColorModeValue(lightModeUrl, darkModeUrl)

  //Priority is set to true to prevent the logo from being lazy loaded and FOC
  return (
    <HStack spacing={1} align={"flex-start"}>
      <Image height={"100"} width={"100"} alt="VebetterDao logo" src={logoUrl} priority={true} />
      <Text fontSize="2xs" fontWeight="bold" color="primary.500">
        DAO
      </Text>
    </HStack>
  )
}

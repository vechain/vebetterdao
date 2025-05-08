"use client"
import { useColorModeValue, Image } from "@chakra-ui/react"
import React from "react"

export const VeBetterDaoLogo: React.FC = () => {
  const lightModeUrl = "/assets/logos/vebetter-isologo-color-light.svg"
  const darkModeUrl = "/assets/logos/vebetter-isologo-color-light.svg"
  const logoUrl = useColorModeValue(lightModeUrl, darkModeUrl)

  //Priority is set to true to prevent the logo from being lazy loaded and FOC
  return <Image width={["120px"]} src={logoUrl} alt="VeBetter Logo" />
}

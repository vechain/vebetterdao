"use client"
import { useColorModeValue, Image } from "@chakra-ui/react"
import React from "react"

export const VeBetterDaoLogo: React.FC = () => {
  const lightModeUrl = "/assets/logos/ve-better-logo-whiteMode.svg"
  // TODO: Modify this light logo with the VBD logo light
  const darkModeUrl = "/assets/logos/VeBetter_White.png"
  const logoUrl = useColorModeValue(lightModeUrl, darkModeUrl)

  //Priority is set to true to prevent the logo from being lazy loaded and FOC
  return <Image width={["120px"]} src={logoUrl} alt="VeBetter Logo" />
}

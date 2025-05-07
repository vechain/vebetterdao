"use client"
import { useColorModeValue } from "@chakra-ui/react"
import Image from "next/image"
import React from "react"

export const VechainLogo: React.FC = () => {
  const lightModeUrl = "/assets/logos/vechain.webp"
  const darkModeUrl = "/assets/logos/vechain_white.webp"
  const logoUrl = useColorModeValue(lightModeUrl, darkModeUrl)

  //Priority is set to true to prevent the logo from being lazy loaded and FOC
  return <Image height={"100"} width={"100"} alt="Vechain logo" src={logoUrl} priority={true} />
}

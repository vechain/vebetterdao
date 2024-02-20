"use client"
import { useColorModeValue } from "@chakra-ui/react"
import Image from "next/image"
import React from "react"

export const VeBetterDaoLogo: React.FC = () => {
  //TODO: Add dark mode logo
  const lightModeUrl = "/images/logo/vebetterdao.svg"
  const darkModeUrl = "/images/logo/vebetterdao.svg"
  const logoUrl = useColorModeValue(lightModeUrl, darkModeUrl)

  //Priority is set to true to prevent the logo from being lazy loaded and FOC
  return <Image height={"100"} width={"100"} alt="VebetterDao logo" src={logoUrl} priority={true} />
}

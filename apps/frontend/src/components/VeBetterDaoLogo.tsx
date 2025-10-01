"use client"
import { Icon, useMediaQuery, Image } from "@chakra-ui/react"
import React from "react"
import B3trIcon from "@/components/Icons/svg/b3tr.svg"
import { useColorModeValue } from "@/components/ui/color-mode"

export const VeBetterDaoLogo: React.FC = () => {
  const lightModeUrl = "/assets/logos/VeBetter_WhiteMode.svg"
  const darkModeUrl = "/assets/logos/VeBetter_DarkMode.svg"
  const logoUrl = useColorModeValue(lightModeUrl, darkModeUrl)
  const [isLargerThan500] = useMediaQuery(["(min-width: 500px)"])
  if (isLargerThan500) {
    //Priority is set to true to prevent the logo from being lazy loaded and FOC
    return <Image width={["120px"]} src={logoUrl} alt="VeBetter Logo" />
  }
  return <Icon as={B3trIcon} color="brand.primary" boxSize={9} />
}

import { Image, ImageProps } from "@chakra-ui/react"
import React from "react"

import { useColorModeValue } from "@/components/ui/color-mode"

type Props = ImageProps & {
  colorVariant?: "light" | "dark"
}
const paths = {
  light: "/assets/logos/vot3_logo.svg",
  dark: "/assets/logos/vot3_logo_dark.svg",
}
/**
 * VOT3Icon is the icon for the VOT3 token
 */
export const VOT3Icon: React.FC<Props> = ({ colorVariant, ...props }) => {
  const logo = useColorModeValue(paths.light, paths.dark)
  const logoVariant = colorVariant ? paths[colorVariant] : logo
  return <Image src={logoVariant} alt="vot3-icon" {...props} />
}

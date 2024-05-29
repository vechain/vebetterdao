import { Image, ImageProps, useColorModeValue } from "@chakra-ui/react"
import React from "react"

type Props = ImageProps & {
  colorVariant?: "light" | "dark"
}

const paths = {
  light: "/images/logo/b3tr_logo.svg",
  dark: "/images/logo/b3tr_logo_dark.svg",
}

/**
 * B3TRIcon is the icon for the B3TR token
 */
export const B3TRIcon: React.FC<Props> = ({ colorVariant, ...props }) => {
  const logo = useColorModeValue(paths.light, paths.dark)
  const logoVariant = colorVariant ? paths[colorVariant] : logo

  return <Image src={logoVariant} alt="B3TR icon" {...props} />
}

import { Image, ImageProps, useColorModeValue } from "@chakra-ui/react"
import React from "react"

type Props = ImageProps & {
  colorVariant?: "light" | "dark"
}

/**
 * B3TRIcon is the icon for the B3TR token
 */
export const B3TRIcon: React.FC<Props> = ({ colorVariant, ...props }) => {
  const logo = useColorModeValue("/images/logo/b3tr_logo.svg", "/images/logo/b3tr_logo_dark.svg")
  const logoVariant = colorVariant
    ? colorVariant === "dark"
      ? "/images/logo/b3tr_logo_dark.svg"
      : "/images/logo/b3tr_logo.svg"
    : logo

  return <Image src={logoVariant} {...props} />
}

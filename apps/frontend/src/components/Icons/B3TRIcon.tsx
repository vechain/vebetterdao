import { Image, ImageProps } from "@chakra-ui/react"
import React from "react"

type Props = ImageProps & {
  colorVariant?: "light" | "dark"
}

const paths = {
  light: "/assets/logos/b3tr_logo.svg",
  dark: "/assets/logos/b3tr_logo_dark.webp",
}

/**
 * B3TRIcon is the icon for the B3TR token
 */
export const B3TRIcon: React.FC<Props> = ({ colorVariant = "dark", ...props }) => {
  const logoVariant = paths[colorVariant]

  return <Image src={logoVariant} alt="B3TR icon" {...props} />
}

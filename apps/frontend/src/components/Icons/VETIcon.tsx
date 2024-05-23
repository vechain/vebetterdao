import { Image, ImageProps, useColorModeValue } from "@chakra-ui/react"
import React from "react"

type Props = ImageProps & {
  colorVariant?: "light" | "dark"
}

const paths = {
  light: "/images/logo/pictogram.png",
  dark: "/images/logo/pictogram_white.png",
}

export const VETIcon: React.FC<Props> = ({ colorVariant, ...props }) => {
  const logo = useColorModeValue(paths.light, paths.dark)
  const logoVariant = colorVariant ? paths[colorVariant] : logo

  return <Image src={logoVariant} {...props} />
}

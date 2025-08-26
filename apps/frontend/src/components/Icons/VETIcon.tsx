import { Image, ImageProps } from "@chakra-ui/react"
import { useColorModeValue } from "@/components/ui/color-mode"
import React from "react"

type Props = ImageProps & {
  colorVariant?: "light" | "dark"
}

const paths = {
  light: "assets/logos/pictogram.webp",
  dark: "assets/logos/pictogram_white.webp",
}

export const VETIcon: React.FC<Props> = ({ colorVariant, ...props }) => {
  const logo = useColorModeValue(paths.light, paths.dark)
  const logoVariant = colorVariant ? paths[colorVariant] : logo

  return <Image src={logoVariant} alt="vet-icon" {...props} />
}

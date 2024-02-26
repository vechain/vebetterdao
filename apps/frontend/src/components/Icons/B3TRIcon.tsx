import { Image, ImageProps, useColorModeValue } from "@chakra-ui/react"
import React from "react"

type Props = ImageProps

/**
 * B3TRIcon is the icon for the B3TR token
 */
export const B3TRIcon: React.FC<Props> = props => {
  const logo = useColorModeValue("/images/logo/b3tr_logo.svg", "/images/logo/b3tr_logo_dark.svg")
  return <Image src={logo} {...props} />
}

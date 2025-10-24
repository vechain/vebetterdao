import { Image, ImageProps } from "@chakra-ui/react"
import React from "react"

type Props = ImageProps
/**
 * B3TRIcon is the icon for the B3TR token
 */
export const TwoFingersIcon: React.FC<Props> = props => (
  <Image src="/assets/icons/two_fingers_icon.svg" alt="two-fingers-icon" {...props} />
)

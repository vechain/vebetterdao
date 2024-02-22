import { Image, ImageProps } from "@chakra-ui/react"
import React from "react"

type Props = ImageProps

/**
 * B3TRIcon is the icon for the B3TR token
 */
export const VOT3Icon: React.FC<Props> = props => <Image src="/images/logo/vot3_logo.svg" {...props} />

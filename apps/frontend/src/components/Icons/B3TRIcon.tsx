import { Image, ImageProps } from "@chakra-ui/react"
import React from "react"

type Props = ImageProps

/**
 * B3TRIcon is the icon for the B3TR token
 */
export const B3TRIcon: React.FC<Props> = props => <Image src="/images/logo/b3tr_logo.svg" {...props} />

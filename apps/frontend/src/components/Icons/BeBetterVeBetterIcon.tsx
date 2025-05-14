import { Image, ImageProps, VStack } from "@chakra-ui/react"
import React from "react"

type Props = {
  beBetterProps?: ImageProps
  veBetterProps?: ImageProps
}

/**
 * BeBetterVeBetterIcon displays the BeBetterVeBetter logo
 */
export const BeBetterVeBetterIcon: React.FC<Props> = ({ veBetterProps, beBetterProps }) => (
  <VStack spacing={2} align="flex-start" w="full">
    <Image src="/assets/icons/be_better.svg" {...beBetterProps} alt="be-better-image" />
    <Image src="/assets/logos/vebetter_dark.svg" {...veBetterProps} alt="ve-better-image" />
  </VStack>
)

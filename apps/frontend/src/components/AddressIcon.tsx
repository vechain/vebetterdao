import React from "react"
import { HTMLChakraProps, Img } from "@chakra-ui/react"
import { PicassoUtils } from "@repo/utils"
const { getPicassoImgSrc } = PicassoUtils

export interface IAddressIcon extends HTMLChakraProps<"img"> {
  address: string
  imageUrl?: string
}
export const AddressIcon: React.FC<IAddressIcon> = ({ address, imageUrl, ...props }) => {
  return <Picasso address={address} imageUrl={imageUrl} {...props} />
}

interface IPicasso extends HTMLChakraProps<"img"> {
  address: string
  imageUrl?: string
}
const Picasso: React.FC<IPicasso> = ({ address, imageUrl, ...props }) => {
  return (
    <Img
      data-cy={`address-icon-${address}`}
      objectFit={"cover"}
      src={imageUrl ?? getPicassoImgSrc(address)}
      h={"100%"}
      {...props}
    />
  )
}

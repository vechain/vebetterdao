import { HTMLChakraProps, Image } from "@chakra-ui/react"
import { PicassoUtils } from "@repo/utils"
import { useGetAvatarOfAddress } from "@vechain/vechain-kit"
import React from "react"

const { getPicassoImgSrc } = PicassoUtils

export interface IAddressIcon extends HTMLChakraProps<"img"> {
  address: string
}

export const AddressIcon: React.FC<IAddressIcon> = ({ address, ...props }) => {
  return <Picasso address={address} {...props} />
}

interface IPicasso extends HTMLChakraProps<"img"> {
  address: string
}

const Picasso: React.FC<IPicasso> = ({ address, ...props }) => {
  const { data: avatar, isLoading: isLoadingAvatar } = useGetAvatarOfAddress(address ?? "")
  return (
    <Image
      data-cy={`address-icon-${address}`}
      alt={props?.alt || `address-icon-${address}`}
      objectFit={"cover"}
      src={avatar && !isLoadingAvatar ? avatar : getPicassoImgSrc(address ?? "")}
      h={"100%"}
      {...props}
    />
  )
}

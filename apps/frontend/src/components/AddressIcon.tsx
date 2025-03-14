import React from "react"
import { HTMLChakraProps, Img } from "@chakra-ui/react"
import { PicassoUtils } from "@repo/utils"
import { useGetAvatar, useIpfsImage, useVechainDomain } from "@vechain/vechain-kit"
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
  const { data: vnsData } = useVechainDomain(address ?? "")
  const { data: profileAvatarUrl } = useGetAvatar(vnsData?.domain ?? "")
  const { data: avatar } = useIpfsImage(profileAvatarUrl)

  return (
    <Img
      data-cy={`address-icon-${address}`}
      objectFit={"cover"}
      src={avatar?.image ?? getPicassoImgSrc(address)}
      h={"100%"}
      {...props}
    />
  )
}

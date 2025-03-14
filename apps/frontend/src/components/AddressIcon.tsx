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

  //Temporary solution to display NFT avatar, this should be fixed and return resolved from the vechain-kit
  const isVetDomainNFTPicture = profileAvatarUrl?.match(/eip155:(\d+)\/(?:erc721|erc1155):([^/]+)\/(\d+)/)
  const avatarImage = isVetDomainNFTPicture ? getPicassoImgSrc(address) : avatar?.image

  return (
    <Img
      data-cy={`address-icon-${address}`}
      objectFit={"cover"}
      src={avatarImage ?? getPicassoImgSrc(address)}
      h={"100%"}
      {...props}
    />
  )
}

import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { Image, Skeleton, SkeletonProps } from "@chakra-ui/react"
import { useXAppMetadata } from "@/api/contracts/xApps"

type Props = {
  appId: string
} & SkeletonProps

export const AppImage = ({ appId, ...props }: Props) => {
  const { data: appMetadata } = useXAppMetadata(appId)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const borderRadius = props.borderRadius ?? "9px"

  return (
    <Skeleton isLoaded={!isLogoLoading} boxSize={"64px"} borderRadius={borderRadius} {...props}>
      <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={"full"} borderRadius={borderRadius} />
    </Skeleton>
  )
}

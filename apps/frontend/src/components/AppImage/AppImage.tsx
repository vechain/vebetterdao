import { notFoundImage } from "@/constants"
import { Avatar, Image, Skeleton, SkeletonProps } from "@chakra-ui/react"
import { useXAppMetadata } from "@/api"

type Props = {
  appId: string
} & SkeletonProps

export const AppImage = ({ appId, ...props }: Props) => {
  const { data: appMetadata, isLoading } = useXAppMetadata(appId)

  const borderRadius = props.borderRadius ?? "9px"

  return (
    <Skeleton asChild loading={isLoading} boxSize={props.boxSize} borderRadius={borderRadius} {...props}>
      <Avatar.Root border="none" rounded={props.borderRadius}>
        <Avatar.Image
          rounded={props.borderRadius}
          src={`https://api.gateway-proxy.vechain.org/ipfs/${appMetadata?.logo.replace("ipfs://", "")}`}
        />
        <Avatar.Fallback asChild>
          <Image
            src={notFoundImage}
            alt={"not found image"}
            boxSize={props.boxSize}
            borderRadius={props.borderRadius}
          />
        </Avatar.Fallback>
      </Avatar.Root>
    </Skeleton>
  )
}

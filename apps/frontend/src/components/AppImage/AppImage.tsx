"use client"
import { Avatar, Image, Skeleton, SkeletonProps } from "@chakra-ui/react"

import { notFoundImage } from "@/constants"

import { useXAppMetadata } from "../../api/contracts/xApps/hooks/useXAppMetadata"

type Props = {
  appId: string
  shape?: "square" | "rounded"
} & SkeletonProps
export const AppImage = ({ appId, shape = "rounded", ...props }: Props) => {
  const { data: appMetadata, isLoading } = useXAppMetadata(appId)
  const borderRadius = props.borderRadius ?? "9px"
  return (
    <Skeleton asChild loading={isLoading} boxSize={props.boxSize} borderRadius={borderRadius} {...props}>
      <Avatar.Root border="none" rounded={props.borderRadius} shape={shape}>
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

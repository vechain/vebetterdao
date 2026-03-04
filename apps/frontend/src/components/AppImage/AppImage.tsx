"use client"
import { Avatar, Image, Skeleton, SkeletonProps } from "@chakra-ui/react"

import { notFoundImage } from "@/constants"
import { convertUriToUrl } from "@/utils/uri"

import { useXAppMetadata } from "../../api/contracts/xApps/hooks/useXAppMetadata"

type Props = {
  appId: string
  appLogo?: string
  shape?: "square" | "rounded"
} & SkeletonProps
export const AppImage = ({ appId, appLogo, shape = "rounded", ...props }: Props) => {
  const { data: appMetadata, isLoading } = useXAppMetadata(appId, appLogo === undefined)
  const logoUri = appLogo ?? appMetadata?.logo
  const borderRadius = props.borderRadius ?? "9px"
  return (
    <Skeleton asChild loading={isLoading} boxSize={props.boxSize} borderRadius={borderRadius} {...props}>
      <Avatar.Root border="none" rounded={props.borderRadius} shape={shape}>
        <Avatar.Image rounded={props.borderRadius} src={logoUri ? convertUriToUrl(logoUri) : undefined} />
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

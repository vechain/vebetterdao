import { AppImage } from "@/components/AppImage/AppImage"
import { Avatar, AvatarGroup, HStack, Skeleton, useBreakpointValue, Text } from "@chakra-ui/react"
import { v4 as uuid } from "uuid"
type Props = {
  appsIds: string[]
  isLoading?: boolean
  otherAppsActiveColor?: boolean
  maxAppsToShow?: number
  iconSize?: number
}

export const OverlappedAppsImages: React.FC<Props> = ({
  appsIds,
  isLoading,
  otherAppsActiveColor = true,
  maxAppsToShow = 4,
  iconSize,
}) => {
  const boxSize = useBreakpointValue({ base: iconSize ?? 28, lg: iconSize ?? 36 })
  const borderRadius = (boxSize ?? 36) / 4

  const appsToRender = appsIds.slice(0, maxAppsToShow)
  const plusCount = appsIds.length - maxAppsToShow

  const otherAppsBoxColor = !otherAppsActiveColor ? "#C9EAA3" : "#D4D6FF"
  const otherAppsTextColor = !otherAppsActiveColor ? "#5C6C4A" : "#4A4FD3"

  if (isLoading)
    return (
      <HStack gap={0}>
        {Array.from({ length: maxAppsToShow }).map(_ => (
          <Skeleton key={`loading-${uuid()}`} boxSize={`${boxSize}px`} borderRadius={`${borderRadius}px`} />
        ))}
      </HStack>
    )

  if (appsIds?.length && appsIds?.length > 0) {
    return (
      <AvatarGroup rounded="8px" shape="square" size="md" stacking="last-on-top" spaceX={"-0.5rem"}>
        {appsToRender?.map(appId => (
          <AppImage key={appId} appId={appId} boxSize={`${boxSize}px`} borderRadius={`${borderRadius}px`} />
        ))}

        {plusCount > 0 && (
          <Avatar.Root
            boxSize={`${boxSize}px`}
            border="none"
            borderRadius={`${borderRadius}px`}
            bgColor={otherAppsBoxColor}>
            <Avatar.Fallback>
              <Text
                fontSize={`${(boxSize ?? 0) / 2}px`}
                fontWeight={600}
                data-testid="participating-add-more-apps"
                color={otherAppsTextColor}>
                {`+${plusCount}`}
              </Text>
            </Avatar.Fallback>
          </Avatar.Root>
        )}
      </AvatarGroup>
    )
  }

  return <></>
}

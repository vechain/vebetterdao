import { AppImage } from "@/components/AppImage/AppImage"
import { Flex, HStack, Skeleton, Text, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
  const boxSize = useBreakpointValue({ base: iconSize ?? 28, lg: iconSize ?? 36 })
  const marginleft = (boxSize ?? 36) / 3
  const borderRadius = (boxSize ?? 36) / 4

  const appsToRender = appsIds.slice(0, maxAppsToShow)

  const remainingApps = appsIds.length - maxAppsToShow

  const otherAppsBoxColor = !otherAppsActiveColor ? "#C9EAA3" : "#D4D6FF"
  const otherAppsTextColor = !otherAppsActiveColor ? "#5C6C4A" : "#4A4FD3"

  // render a gallery where every app overlaps each other with a small offset
  // if we have more than 5 apps, the 5th bacame a card with the number of apps that are not shown
  // if we have less than 5 apps, we show them all
  // if we have no apps, we render nothing

  if (isLoading)
    return (
      <HStack gap={0}>
        {Array.from({ length: maxAppsToShow }).map(_ => (
          <Skeleton key={`loading-${uuid()}`} boxSize={`${boxSize}px`} borderRadius={`${borderRadius}px`} />
        ))}
      </HStack>
    )

  if (appsIds?.length) {
    return (
      <HStack gap={0}>
        {appsToRender?.map((appId, index) => {
          const ml = index > 0 ? `-${marginleft}px` : "0"
          return (
            <AppImage
              key={`app-image-${appId}`}
              appId={appId}
              boxSize={`${boxSize}px`}
              borderRadius={`${borderRadius}px`}
              ml={ml}
              zIndex={1}
            />
          )
        })}
        {appsIds.length > maxAppsToShow && (
          <Flex
            zIndex={1}
            boxSize={`${boxSize}px`}
            borderRadius={`${borderRadius}px`}
            ml={`-${marginleft}px`}
            bg={otherAppsBoxColor}
            justify={"center"}
            align={"center"}>
            <Text
              fontSize={`${(boxSize ?? 0) / 2}px`}
              fontWeight={600}
              data-testid="participating-add-more-apps"
              color={otherAppsTextColor}>
              {t("+{{value}}", { value: remainingApps })}
            </Text>
          </Flex>
        )}
      </HStack>
    )
  }

  return <></>
}

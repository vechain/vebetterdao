import { useAllocationsRoundState, useRoundXApps } from "@/api"
import { AppImage } from "@/components/AppImage/AppImage"
import { Flex, HStack, Text, useBreakpointValue } from "@chakra-ui/react"
import { t } from "i18next"

type Props = {
  roundId: string
  maxAppsToShow?: number
}
export const AllocationRoundParticipatingXApps: React.FC<Props> = ({ roundId, maxAppsToShow = 4 }) => {
  const boxSize = useBreakpointValue({ base: 28, lg: 36 })
  const marginleft = (boxSize ?? 36) / 3
  const borderRadius = (boxSize ?? 36) / 4
  const { data: xApps, isLoading: xAppsLoading } = useRoundXApps(roundId)

  const { data: state } = useAllocationsRoundState(roundId)
  const appsToRender = xApps?.slice(0, maxAppsToShow)
  const remainingApps = (xApps?.length ?? 0) - maxAppsToShow

  const otherAppsBoxColor = state === 0 ? "#C9EAA3" : "#D4D6FF"
  const otherAppsTextColor = state === 0 ? "#5C6C4A" : "#4A4FD3"

  // render a gallery where every app overlaps each other with a small offset
  // if we have more than 5 apps, the 5th bacame a card with the number of apps that are not shown
  // if we have less than 5 apps, we show them all
  // if we have no apps, we render nothing
  if (xApps?.length) {
    return (
      <HStack spacing={0}>
        {appsToRender?.map((xApp, index) => {
          const ml = index > 0 ? `-${marginleft}px` : "0"
          return (
            <AppImage
              key={xApp.id}
              appId={xApp.id}
              boxSize={`${boxSize}px`}
              borderRadius={`${borderRadius}px`}
              ml={ml}
              zIndex={1}
            />
          )
        })}
        {xApps.length > maxAppsToShow && (
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

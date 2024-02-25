import { TooltipBackgroundColor, TooltipTextColor } from "@/app/theme"
import { Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverTrigger, useColorMode } from "@chakra-ui/react"

type Props = {
  children: React.ReactNode
  text: string
  placement?: "top" | "bottom"
}

export const BaseTooltip: React.FC<Props> = ({ children, text, placement = "bottom" }) => {
  const { colorMode } = useColorMode()
  const isDark = colorMode === "dark"

  return (
    <Popover
      data-cy="base-tooltip"
      trigger="hover"
      openDelay={40}
      closeDelay={40}
      arrowShadowColor={TooltipBackgroundColor(isDark)}
      placement={placement}>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        color={TooltipTextColor(isDark)}
        bg={TooltipBackgroundColor(isDark)}
        borderColor={TooltipBackgroundColor(isDark)}>
        <PopoverArrow bg={TooltipBackgroundColor(isDark)} borderColor={TooltipBackgroundColor(isDark)} />
        <PopoverBody fontSize={"sm"} fontWeight={"medium"} w={"full"}>
          {text}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

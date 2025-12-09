import { Tooltip as ChakraTooltip, Portal } from "@chakra-ui/react"
import * as React from "react"

export interface TooltipProps extends ChakraTooltip.RootProps {
  showArrow?: boolean
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement>
  content: React.ReactNode
  contentProps?: ChakraTooltip.ContentProps
  disabled?: boolean
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  const { showArrow = true, children, disabled, portalled = true, content, contentProps, portalRef, ...rest } = props
  const [isOpen, setIsOpen] = React.useState(false)
  const [isTouchDevice, setIsTouchDevice] = React.useState(false)

  React.useEffect(() => {
    // Detect if device supports touch
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
  }, [])

  const handleToggle = () => {
    if (isTouchDevice) {
      setIsOpen(!isOpen)
    }
  }

  const handleClickOutside = React.useCallback(() => {
    if (isTouchDevice && isOpen) {
      setIsOpen(false)
    }
  }, [isTouchDevice, isOpen])

  React.useEffect(() => {
    if (isTouchDevice && isOpen) {
      document.addEventListener("touchstart", handleClickOutside)
      return () => document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isTouchDevice, isOpen, handleClickOutside])

  if (disabled) return children

  return (
    <ChakraTooltip.Root open={isTouchDevice ? isOpen : undefined} openDelay={40} closeDelay={40} {...rest}>
      <ChakraTooltip.Trigger asChild onClick={handleToggle}>
        {children}
      </ChakraTooltip.Trigger>
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content
            color="text.default"
            ref={ref}
            css={{ "--tooltip-bg": "var(--vbd-colors-bg-alt)" }}
            {...contentProps}>
            {showArrow && (
              <ChakraTooltip.Arrow>
                <ChakraTooltip.ArrowTip />
              </ChakraTooltip.Arrow>
            )}
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  )
})

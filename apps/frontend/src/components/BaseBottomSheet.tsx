import { Box, Drawer, Portal, VisuallyHidden, CloseButton, Heading, Text } from "@chakra-ui/react"
import { useDrag } from "@use-gesture/react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

type Props = {
  isOpen: boolean
  onClose: () => void
  height?: string
  children: React.ReactNode
  ariaTitle: string
  ariaDescription: string
  isDismissable?: boolean
  customBgColor?: string
  minHeight?: string
  footer?: React.ReactNode
  title?: string | React.ReactNode
  illustration?: string
  showCloseButton?: boolean
  description?: string | React.ReactNode
  full?: boolean
}

const DRAG_THRESHOLD = 150
const VELOCITY_THRESHOLD = 0.5
const SCROLL_LOCK_TIMEOUT = 100
const CLOSE_ANIMATION_DURATION = 200

const isScrollable = (el: HTMLElement) => {
  const style = window.getComputedStyle(el)
  return /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY)
}

export const BaseBottomSheet = ({
  isOpen,
  onClose,
  children,
  ariaTitle = "BottomSheet",
  ariaDescription,
  isDismissable = true,
  minHeight,
  footer,
  title,
  illustration,
  showCloseButton,
  description,
  full = false,
}: Props) => {
  const [dragY, setDragY] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const isAllowedToDrag = useRef(false)
  const lastTimeDragPrevented = useRef<Date | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setDragY(0)
    }
  }, [isOpen])

  const shouldDrag = (target: EventTarget) => {
    let el = target as HTMLElement
    const now = new Date()

    if (
      lastTimeDragPrevented.current &&
      now.getTime() - lastTimeDragPrevented.current.getTime() < SCROLL_LOCK_TIMEOUT
    ) {
      lastTimeDragPrevented.current = now
      return false
    }

    while (el) {
      if (el.scrollHeight > el.clientHeight && isScrollable(el)) {
        if (el.scrollTop > 0) {
          lastTimeDragPrevented.current = now
          return false
        }
      }
      el = el.parentNode as HTMLElement
    }

    return true
  }

  const bind = useDrag(
    ({ down, movement: [, my], velocity: [, vy], direction: [, dy], first, event, cancel }) => {
      if (!isDismissable) return

      if (first && event.target) {
        isAllowedToDrag.current = shouldDrag(event.target)
      }

      if (!isAllowedToDrag.current && my > 0) {
        cancel()
        return
      }

      if (down && my > 0) {
        setDragY(my)
      } else {
        isAllowedToDrag.current = false
        const shouldClose =
          dy === 0 ? my > DRAG_THRESHOLD : dy > 0 && my > DRAG_THRESHOLD / 2 && vy > VELOCITY_THRESHOLD

        if (shouldClose) {
          setDragY(window.innerHeight)
          closeTimeoutRef.current = setTimeout(() => {
            onClose()
          }, CLOSE_ANIMATION_DURATION)
        } else {
          setDragY(0)
        }
      }
    },
    {
      filterTaps: true,
      axis: "y",
      pointer: { touch: true },
    },
  )

  return (
    <Drawer.Root
      placement="bottom"
      size="full"
      closeOnInteractOutside={isDismissable}
      open={isOpen}
      onOpenChange={e => {
        if (!e.open) {
          onClose()
        }
      }}>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content
            ref={contentRef}
            aria-description={ariaDescription}
            bg="bg.primary"
            borderTopRadius="10px"
            h={full ? "100dvh" : "auto"}
            maxH={full ? "unset" : "90dvh"}
            minHeight={minHeight}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            style={{
              transform: `translateY(${dragY}px)`,
              transition: "transform 0.2s ease-out",
            }}>
            <VisuallyHidden>
              <Drawer.Title>{ariaTitle}</Drawer.Title>
            </VisuallyHidden>

            <Drawer.Body
              flex={1}
              overflowY="auto"
              p={4}
              display="flex"
              flexDirection="column"
              {...(isDismissable ? bind() : {})}>
              {isDismissable && <Box mx="auto" w="34px" h="5px" bg="#D7D6D4" mb={4} rounded="full" />}
              {(title || illustration) && (
                <Box mb={4}>
                  <Box position="relative">
                    {illustration && (
                      <Box position="relative" boxSize="16" mx="auto">
                        <Image alt="modal-illustration" src={illustration} fill />
                      </Box>
                    )}
                    {showCloseButton && (
                      <Box position="absolute" top={0} right={0}>
                        <CloseButton size="md" onClick={onClose} />
                      </Box>
                    )}
                  </Box>
                  {title && typeof title === "string" ? (
                    <Heading fontWeight="bold" textStyle="md" textAlign="center">
                      {title}
                    </Heading>
                  ) : (
                    title
                  )}
                  {description && (
                    <Text textAlign={illustration ? "center" : "left"} color="text.secondary">
                      {description}
                    </Text>
                  )}
                </Box>
              )}
              {children}
            </Drawer.Body>

            {footer && <Drawer.Footer>{footer}</Drawer.Footer>}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}

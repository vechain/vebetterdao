import { Box, Drawer, Portal, VisuallyHidden, CloseButton, Heading, Text } from "@chakra-ui/react"
import { useDrag } from "@use-gesture/react"
import Image from "next/image"
import { useRef, useState } from "react"

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
  initialFocusEl?: () => HTMLElement | null
}

const DRAG_THRESHOLD = 150
const VELOCITY_THRESHOLD = 0.5

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
  initialFocusEl,
}: Props) => {
  const [dragY, setDragY] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const bind = useDrag(
    ({ down, movement: [, my], velocity: [, vy], direction: [, dy] }) => {
      if (!isDismissable) return

      if (down && my > 0) {
        setDragY(my)
      } else {
        if (my > DRAG_THRESHOLD || (vy > VELOCITY_THRESHOLD && dy > 0)) {
          onClose()
        }
        setDragY(0)
      }
    },
    {
      from: () => [0, dragY],
      filterTaps: true,
      axis: "y",
      bounds: { top: 0 },
    },
  )

  return (
    <Drawer.Root
      initialFocusEl={initialFocusEl}
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
              transition: dragY === 0 ? "transform 0.2s ease-out" : "none",
            }}
            {...(isDismissable ? bind() : {})}>
            <VisuallyHidden>
              <Drawer.Title>{ariaTitle}</Drawer.Title>
            </VisuallyHidden>

            <Drawer.Body flex={1} overflowY="auto" p={4} display="flex" flexDirection="column">
              <Box
                mx="auto"
                w="34px"
                h="5px"
                bg="#D7D6D4"
                mb={4}
                rounded="full"
                cursor={isDismissable ? "grab" : "default"}
                _active={isDismissable ? { cursor: "grabbing" } : {}}
              />
              {(title || illustration || showCloseButton) && (
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
                  {title && (
                    <Heading fontWeight="bold" textStyle="md" textAlign="center">
                      {title}
                    </Heading>
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

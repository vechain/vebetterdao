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
      filterTaps: true,
      axis: "y",
      pointer: { touch: true },
    },
  )

  return (
    <Drawer.Root
      placement="bottom"
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
            h="auto"
            maxH="90dvh"
            minHeight={minHeight}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            style={{
              transform: `translateY(${dragY}px)`,
              transition: dragY === 0 ? "transform 0.2s ease-out" : "none",
            }}>
            <VisuallyHidden>
              <Drawer.Title>{ariaTitle}</Drawer.Title>
            </VisuallyHidden>

            <Box
              w="full"
              pt={4}
              pb={2}
              cursor={isDismissable ? "grab" : "default"}
              _active={isDismissable ? { cursor: "grabbing" } : {}}
              style={{ touchAction: "none" }}
              {...(isDismissable ? bind() : {})}>
              <Box mx="auto" w="34px" h="5px" bg="#D7D6D4" rounded="full" />
            </Box>

            <Drawer.Body flex={1} overflowY="auto" px={4} pb={4} display="flex" flexDirection="column">
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

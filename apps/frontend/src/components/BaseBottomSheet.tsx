import { Box, VisuallyHidden } from "@chakra-ui/react"
import { Drawer } from "vaul"

import { useColorModeValue } from "@/components/ui/color-mode"

type Props = {
  isOpen: boolean
  onClose: () => void
  height?: string
  children: React.ReactNode
  ariaTitle: string
  ariaDescription: string
  isDismissable?: boolean
  customBgColor?: string
}
export const BaseBottomSheet = ({
  isOpen,
  onClose,
  children,
  ariaTitle = "BottomSheet",
  ariaDescription,
  isDismissable = true,
  customBgColor,
}: Props) => {
  const bgColor = useColorModeValue("#F9FAFB", "#1A1A1A")
  return (
    <Drawer.Root
      dismissible={isDismissable}
      shouldScaleBackground
      repositionInputs={false}
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose()
        }
      }}>
      <Drawer.Portal>
        <Drawer.Overlay
          style={{
            zIndex: 2,
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0, 0, 0, 0.50)",
          }}
        />
        <Drawer.Content
          aria-description={ariaDescription}
          aria-describedby={ariaTitle}
          style={{
            zIndex: 3,
            backgroundColor: customBgColor ?? bgColor,
            borderRadius: "10px 10px 0 0",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "auto", // Let the content define the height initially
            maxHeight: "90vh", // Limit to a maximum of 90% of the viewport height
            overflow: "hidden", // Prevent content from overflowing out of the drawer
            display: "flex",
            flexDirection: "column",
          }}>
          <VisuallyHidden>
            <Drawer.Title>{ariaTitle}</Drawer.Title>
          </VisuallyHidden>

          {/* Scrollable content area */}
          <div
            style={{
              backgroundColor: customBgColor ?? bgColor,
              borderRadius: "10px 10px 0 0",
              flex: 1,
              overflowY: "auto", // Only scroll if content overflows
              padding: "1rem",
            }}>
            <Box mx={"auto"} w={"34px"} h={"5px"} bg={"#D7D6D4"} mb={4} rounded={"full"} />
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

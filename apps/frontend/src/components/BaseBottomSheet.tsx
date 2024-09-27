import { Box } from "@chakra-ui/react"
import { Drawer } from "vaul"

type Props = {
  isOpen: boolean
  onClose: () => void
  height?: string
  children: React.ReactNode
}
export const BaseBottomSheet = ({ isOpen, onClose, children, height }: Props) => {
  return (
    <Drawer.Root
      shouldScaleBackground
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
          style={{
            zIndex: 3,
            backgroundColor: "#F9FAFB",
            borderRadius: "10px 10px 0 0",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height,
          }}>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "10px 10px 0 0",
              flex: 1,
              padding: "1rem",
            }}>
            <Box mx={"auto"} w={"34px"} h={"5px"} bg={"#D7D6D4"} mb={8} rounded={"full"} />
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

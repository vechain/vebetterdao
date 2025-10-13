import { Dialog, Portal } from "@chakra-ui/react"

import { useBreakpoints } from "../hooks/useBreakpoints"

export const CustomModalContent = ({ children, ...others }: Dialog.ContentProps) => {
  const { isMobile } = useBreakpoints()
  return (
    <Portal>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        {isMobile ? (
          <Dialog.Content
            position="fixed"
            bottom="0px"
            mb="0"
            roundedTop={"20px"}
            roundedBottom="0"
            maxHeight="90vh"
            overflow="auto"
            {...others}>
            {children}
          </Dialog.Content>
        ) : (
          <Dialog.Content rounded={"20px"} {...others}>
            {children}
          </Dialog.Content>
        )}
      </Dialog.Positioner>
    </Portal>
  )
}

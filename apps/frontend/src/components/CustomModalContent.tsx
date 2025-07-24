import { Dialog, Show, useMediaQuery } from "@chakra-ui/react"

export const CustomModalContent = ({ children, ...others }: Dialog.ContentProps) => {
  const [isMobile] = useMediaQuery(["(max-width: 768px)"])
  return (
    <>
      <Show when={isMobile}>
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
      </Show>
      <Show when={!isMobile}>
        <Dialog.Content rounded={"20px"} {...others}>
          {children}
        </Dialog.Content>
      </Show>
    </>
  )
}

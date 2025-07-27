import { Dialog } from "@chakra-ui/react"

export const CustomModalContent = ({ children, ...others }: Dialog.ContentProps) => {
  return (
    <>
      <Dialog.Content
        hideFrom="md"
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

      <Dialog.Content hideBelow="md" rounded={"20px"} {...others}>
        {children}
      </Dialog.Content>
    </>
  )
}

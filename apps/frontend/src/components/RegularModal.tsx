import { Dialog, Portal, CloseButton } from "@chakra-ui/react"

type Props = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  ariaTitle?: string
  ariaDescription?: string
  modalProps?: Partial<Dialog.RootProps>
  modalContentProps?: Partial<Dialog.ContentProps>
  modalBodyProps?: Partial<Dialog.BodyProps>
  showCloseButton?: boolean
  isCloseable?: boolean
  size?: Dialog.RootProps["size"]
}
export const RegularModal = ({
  isOpen,
  onClose,
  children,
  ariaTitle,
  ariaDescription,
  modalProps,
  modalContentProps,
  modalBodyProps,
  showCloseButton = false,
  isCloseable = true,
  size = "lg",
}: Props) => {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={details => {
        if (!details.open) {
          onClose()
        }
      }}
      size={size}
      trapFocus={false}
      {...modalProps}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content {...modalContentProps}>
            {(ariaTitle || ariaDescription) && (
              <Dialog.Header display="flex" alignItems="center" px={8} py={10} position="relative">
                {ariaTitle && (
                  <Dialog.Title textStyle="2xl" textAlign="start">
                    {ariaTitle}
                  </Dialog.Title>
                )}
                {ariaDescription && <Dialog.Description textAlign="center">{ariaDescription}</Dialog.Description>}

                {/* Close button positioned absolutely to the right */}
                {isCloseable && showCloseButton && (
                  <Dialog.CloseTrigger asChild position="absolute" right={6} top="50%" transform="translateY(-50%)">
                    <CloseButton size="md" />
                  </Dialog.CloseTrigger>
                )}
              </Dialog.Header>
            )}
            {!ariaTitle && !ariaDescription && isCloseable && showCloseButton ? (
              <Dialog.CloseTrigger asChild>
                <CloseButton size="md" />
              </Dialog.CloseTrigger>
            ) : null}
            <Dialog.Body px={8} rounded={"2xl"} {...modalBodyProps}>
              {children}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

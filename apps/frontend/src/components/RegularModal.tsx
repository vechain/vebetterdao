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
      variant="base"
      open={isOpen}
      onOpenChange={details => {
        if (!details.open) {
          onClose()
        }
      }}
      size={size}
      placement="center"
      trapFocus={false}
      {...modalProps}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content rounded={"2xl"} {...modalContentProps}>
            {(ariaTitle || ariaDescription) && (
              <Dialog.Header>
                {ariaTitle && <Dialog.Title>{ariaTitle}</Dialog.Title>}
                {ariaDescription && <Dialog.Description>{ariaDescription}</Dialog.Description>}
                {isCloseable && showCloseButton ? (
                  <Dialog.CloseTrigger asChild>
                    <CloseButton size="md" />
                  </Dialog.CloseTrigger>
                ) : null}
              </Dialog.Header>
            )}
            {!ariaTitle && !ariaDescription && isCloseable && showCloseButton ? (
              <Dialog.CloseTrigger asChild>
                <CloseButton size="md" />
              </Dialog.CloseTrigger>
            ) : null}
            <Dialog.Body p={10} rounded={"2xl"} {...modalBodyProps}>
              {children}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

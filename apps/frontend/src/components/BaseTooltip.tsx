import { Popover } from "@chakra-ui/react"

type Props = {
  children: React.ReactNode
  text: string | React.ReactNode
  placement?: "top" | "bottom"
  showTooltip?: boolean
}

export const BaseTooltip: React.FC<Props> = ({ children, text, placement = "bottom", showTooltip = true }) => {
  if (!showTooltip) {
    return <>{children}</>
  }

  return (
    <Popover.Root
      data-cy="base-tooltip"
      //  trigger="hover"
      openDelay={40}
      closeDelay={40}
      arrowShadowColor="rgba(0, 0, 0, 0.75)"
      placement={placement}>
      <Popover.Trigger>{children}</Popover.Trigger>
      <Popover.Content
        color="white"
        bg="rgba(0, 0, 0, 0.75)"
        borderColor="rgba(0, 0, 0, 0.75)"
        backdropFilter="blur(10px)"
        boxShadow="0px 4px 12px rgba(0, 0, 0, 0.1)"
        borderRadius="8px"
        fontSize="sm"
        p={0.7}>
        <Popover.Arrow bg="rgba(0, 0, 0, 0.75)" borderColor="rgba(0, 0, 0, 0.75)" />
        <Popover.Body fontSize={"sm"} fontWeight={"medium"} w={"full"}>
          {text}
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  )
}

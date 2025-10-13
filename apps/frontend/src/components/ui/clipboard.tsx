import { IconButton, Clipboard as ChakraClipboard } from "@chakra-ui/react"

const DEFAULT_TIMEOUT = 10000
export const Clipboard = ({ value, timeout = DEFAULT_TIMEOUT }: { value: string; timeout?: number }) => {
  return (
    <ChakraClipboard.Root value={value} timeout={timeout}>
      <ChakraClipboard.Trigger asChild>
        <IconButton variant="ghost" size="xs">
          <ChakraClipboard.Indicator />
        </IconButton>
      </ChakraClipboard.Trigger>
    </ChakraClipboard.Root>
  )
}

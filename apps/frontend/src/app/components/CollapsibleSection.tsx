import { useBreakpoints } from "@/hooks"
import { VStack, Heading, HStack, Accordion } from "@chakra-ui/react"

export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) => {
  const { isMobile } = useBreakpoints()

  if (!isMobile) {
    return (
      <VStack align="flex-start" w="full" pb={2} borderBottom="1px solid #D5D5D5">
        <Heading size="xl" pt={0}>
          {title}
        </Heading>
        {children}
      </VStack>
    )
  }

  return (
    <Accordion.Root
      w="full"
      multiple
      defaultValue={defaultOpen ? [`section-${title}`] : []}
      borderBottom="1px solid #D5D5D5">
      <Accordion.Item value={`section-${title}`} border="none" w="full">
        <Accordion.ItemTrigger w="full" rounded="12px" px="0" py="3" _hover={{ bg: "blackAlpha.50" }}>
          <HStack w="full" justify="space-between">
            <Heading size="xl">{title}</Heading>
            <Accordion.ItemIndicator />
          </HStack>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent px="0" pb="0">
          {children}
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  )
}

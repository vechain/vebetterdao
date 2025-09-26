import { useBreakpoints } from "@/hooks"
import { Accordion, Heading, HStack, Separator, VStack } from "@chakra-ui/react"

export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
  showSeparator = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  showSeparator?: boolean
}) => {
  const { isMobile } = useBreakpoints()

  if (!isMobile) {
    return (
      <>
        <VStack align="flex-start" w="full">
          <Heading size="xl" p={0}>
            {title}
          </Heading>
          {children}
        </VStack>
        {showSeparator && <Separator my={2} w="full" color="gray.200" />}
      </>
    )
  }

  return (
    <>
      <Accordion.Root w="full" multiple defaultValue={defaultOpen ? [`section-${title}`] : []}>
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
      {showSeparator && <Separator my={2} w="full" color="gray.200" />}
    </>
  )
}

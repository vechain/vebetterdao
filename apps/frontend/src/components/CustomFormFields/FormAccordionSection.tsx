import { Accordion, Text } from "@chakra-ui/react"

export type FormAccordionSectionProps = {
  title?: string
  customTitle?: React.ReactNode
  children: React.ReactNode
}

export const FormAccordionSection = ({ title, customTitle, children }: FormAccordionSectionProps) => {
  return (
    <Accordion.Item borderTop="none" value={title || "section"}>
      <Accordion.ItemTrigger w="full" py={4} textAlign="left" justifyContent="space-between">
        {customTitle || (
          <Text fontSize="lg" fontWeight="semibold">
            {title}
          </Text>
        )}
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody>{children}</Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  )
}

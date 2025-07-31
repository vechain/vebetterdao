import { AccordionItem, AccordionButton, AccordionIcon, AccordionPanel, Text } from "@chakra-ui/react"

export type FormAccordionSectionProps = {
  title?: string
  customTitle?: React.ReactNode
  children: React.ReactNode
}

export const FormAccordionSection = ({ title, customTitle, children }: FormAccordionSectionProps) => {
  return (
    <AccordionItem borderTop="none">
      <AccordionButton w="full" py={4} textAlign="left" justifyContent="space-between">
        {customTitle || (
          <Text fontSize="lg" fontWeight="semibold">
            {title}
          </Text>
        )}
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel>{children}</AccordionPanel>
    </AccordionItem>
  )
}

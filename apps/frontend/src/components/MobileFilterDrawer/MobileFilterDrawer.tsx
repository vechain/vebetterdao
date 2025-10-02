import { Button, Checkbox, HStack, Icon, ListCollection, type StackProps, Text, VStack } from "@chakra-ui/react"
import { UilFilter } from "@iconscout/react-unicons"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { BaseModal } from "../BaseModal"

interface MobileFilterDrawerProps extends StackProps {
  options: ListCollection<{ label: string; value: any }>
  selectedValues: any[]
  onApply: (values: any[]) => void
  placeholder?: string
}

export const MobileFilterDrawer = ({
  options,
  selectedValues,
  onApply,
  placeholder = "Filter",
  ...boxProps
}: MobileFilterDrawerProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [tempSelectedValues, setTempSelectedValues] = useState<any[]>(selectedValues)

  const selectedCount = selectedValues.length

  const handleToggleOption = (value: any) => {
    setTempSelectedValues(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
  }

  const handleReset = () => {
    setTempSelectedValues([])
  }

  const handleApply = () => {
    onApply(tempSelectedValues)
    setIsOpen(false)
  }

  const handleOpen = () => {
    setTempSelectedValues(selectedValues)
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setTempSelectedValues(selectedValues) // Reset temp values when closing
  }

  return (
    <VStack {...boxProps}>
      {/* Filter Icon Button */}
      <Button
        size="md"
        variant="outline"
        borderRadius="lg"
        p={3}
        minW="auto"
        aspectRatio="1"
        onClick={handleOpen}
        position="relative">
        <Icon as={UilFilter} boxSize={5} />
        {selectedCount > 0 && (
          <Text
            position="absolute"
            top="-8px"
            right="-8px"
            bg="actions.primary.default"
            color="white"
            borderRadius="full"
            minW="20px"
            h="20px"
            textStyle="xs"
            fontWeight="semibold"
            display="flex"
            alignItems="center"
            justifyContent="center">
            {selectedCount}
          </Text>
        )}
      </Button>

      <BaseModal isOpen={isOpen} onClose={handleClose} ariaTitle={placeholder} ariaDescription="Filter options">
        <VStack align="stretch" gap={6} w="full">
          {/* Header */}
          <Text textStyle="md" fontWeight="bold">
            {placeholder}
          </Text>

          {/* Options */}
          <VStack align="stretch" gap={5} maxH="50vh" overflowY="auto">
            {options.items.map(option => {
              const isSelected = tempSelectedValues.includes(option.value)
              return (
                <HStack
                  key={option.value}
                  align="center"
                  cursor="pointer"
                  onClick={() => handleToggleOption(option.value)}>
                  <Checkbox.Root size="md" checked={isSelected}>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Root>
                  <Text textStyle="md">{option.label}</Text>
                </HStack>
              )
            })}
          </VStack>

          {/* Footer Actions */}
          <HStack w="full" gap={3} alignItems="stretch">
            <Button variant="secondary" flex={1} onClick={handleReset}>
              {t("Reset")}
            </Button>
            <Button variant="primary" flex={1} onClick={handleApply}>
              {t("Apply")}
            </Button>
          </HStack>
        </VStack>
      </BaseModal>
    </VStack>
  )
}

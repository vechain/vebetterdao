import { HStack, Icon, ListCollection, Portal, Select } from "@chakra-ui/react"
import { ElementType } from "react"

export const SelectField = ({
  options,
  defaultValue,
  onChange,
  leftIcon,
  placeholder,
  isMultiOption = false,
}: {
  options: ListCollection<{ label: string; value: any }>
  onChange: (value: string[]) => void
  defaultValue?: string | string[]
  leftIcon?: ElementType
  placeholder?: string
  isMultiOption?: boolean
}) => {
  return (
    <Select.Root
      collection={options}
      variant="filled"
      maxW={"220px"}
      {...(isMultiOption && { multiple: true })}
      {...(defaultValue && { defaultValue: Array.isArray(defaultValue) ? defaultValue : [defaultValue] })}
      onValueChange={e => onChange(e.value)}>
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <HStack gap={2} w="full">
            {leftIcon && <Icon as={leftIcon} size={"sm"} />}
            <Select.ValueText placeholder={placeholder} />
          </HStack>
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {options.items.map(option => (
              <Select.Item item={option} key={option.value}>
                {option.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}

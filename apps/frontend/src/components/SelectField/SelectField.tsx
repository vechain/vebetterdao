import { HStack, Icon, ListCollection, Portal, Select } from "@chakra-ui/react"
import { ElementType } from "react"

export const SelectField = ({
  options,
  defaultSortOption,
  onChange,
  leftIcon,
  placeholder,
}: {
  options: ListCollection<{ label: string; value: string }>
  onChange: (value: string[]) => void
  defaultSortOption?: string
  leftIcon?: ElementType
  placeholder?: string
}) => {
  return (
    <Select.Root
      collection={options}
      variant="filled"
      maxW={"220px"}
      {...(defaultSortOption && { defaultValue: [defaultSortOption] })}
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

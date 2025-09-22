import { Checkbox, HStack, Icon, ListCollection, Portal, Select, Text } from "@chakra-ui/react"
import { ElementType } from "react"
import { useTranslation } from "react-i18next"

interface SelectFieldProps
  extends Omit<Select.RootProps, "collection" | "onValueChange" | "defaultValue" | "multiple" | "onChange"> {
  options: ListCollection<{ label: string; value: any }>
  onChange: (value: string[]) => void
  defaultValue?: string | string[]
  leftIcon?: ElementType
  placeholder?: string
  isMultiOption?: boolean
  showReset?: boolean
}

export const SelectField = ({
  options,
  defaultValue,
  onChange,
  leftIcon,
  placeholder,
  isMultiOption = false,
  showReset = false,
  ...selectProps
}: SelectFieldProps) => {
  const { t } = useTranslation()
  return (
    <Select.Root
      {...selectProps}
      collection={options}
      variant="filled"
      {...(isMultiOption && { multiple: true })}
      {...(defaultValue && { defaultValue: Array.isArray(defaultValue) ? defaultValue : [defaultValue] })}
      onValueChange={e => onChange(e.value)}>
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <HStack gap={2} w="full">
            {leftIcon && <Icon as={leftIcon} size={"sm"} />}
            <Select.ValueText placeholder={placeholder}>
              <Select.Context>
                {select => {
                  const selectedCount = select.selectedItems.length
                  return selectedCount ? `${placeholder} (${selectedCount})` : placeholder
                }}
              </Select.Context>
            </Select.ValueText>
          </HStack>
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content borderRadius="2xl" gap={2} p={4}>
            <Select.Context>
              {select =>
                options.items.map(option => {
                  const isSelected = select.selectedItems.some((item: any) => item.value === option.value)
                  return (
                    <Select.Item item={option} key={option.value}>
                      <HStack>
                        {isMultiOption && (
                          <Checkbox.Root size="sm" checked={isSelected}>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Root>
                        )}
                        <Text fontSize="14px">{option.label}</Text>
                      </HStack>
                    </Select.Item>
                  )
                })
              }
            </Select.Context>
            {showReset ? (
              <Select.ClearTrigger alignSelf="flex-start">
                <Text color="actions.primary.default" fontWeight="500" fontSize="14px" cursor="pointer" py={2}>
                  {t("Reset")}
                </Text>
              </Select.ClearTrigger>
            ) : null}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}

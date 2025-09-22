import { createListCollection, Field, Portal, RadioGroup, Select } from "@chakra-ui/react"
import { useMemo } from "react"
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"

interface FormSelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

interface FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
  control: Control<TFieldValues>
  label?: string
  placeholder?: string
  options: FormSelectOption[]
  error?: string
  disabled?: boolean
  required?: boolean
  defaultValue?: FormSelectOption["value"]
}

export const FormSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: FormSelectProps<TFieldValues, TName>,
) => {
  const { name, control, label, placeholder, options, error, disabled, required, defaultValue, ...rest } = props

  // Create list collection for Chakra UI Select
  const collection = useMemo(() => {
    return createListCollection({
      items: options.map(option => ({
        label: option.label,
        value: String(option.value),
        disabled: option.disabled,
      })),
    })
  }, [options])

  return (
    <Field.Root invalid={!!error} disabled={disabled} required={required} {...rest} w="full">
      {label && <Field.Label>{label}</Field.Label>}

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <RadioGroup.Root
            w="full"
            value={field.value ? String(field.value) : ""}
            {...(defaultValue && { defaultValue: String(defaultValue) })}>
            <Select.Root
              w="full"
              collection={collection}
              {...(defaultValue && { defaultValue: [String(defaultValue)] })}
              value={field.value ? [String(field.value)] : []}
              onValueChange={details => {
                const selectedValue = details.value[0]
                const selectedOption = options.find(opt => String(opt.value) === selectedValue)
                field.onChange(selectedOption?.value || "")
              }}
              disabled={disabled}>
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder={placeholder} />
                </Select.Trigger>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content p={4} gap={4}>
                    {collection.items.map(item => (
                      <Select.Item item={item} key={item.value}>
                        <RadioGroup.Item value={item.value} disabled={item.disabled}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemControl>
                            <RadioGroup.ItemIndicator />
                          </RadioGroup.ItemControl>
                          <RadioGroup.ItemText>{item.label}</RadioGroup.ItemText>
                        </RadioGroup.Item>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </RadioGroup.Root>
        )}
      />
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  )
}

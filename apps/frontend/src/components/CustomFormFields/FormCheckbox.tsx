import { Checkbox, Field, Text } from "@chakra-ui/react"
import React from "react"
import { Control, Controller, FieldPath, FieldValues, RegisterOptions } from "react-hook-form"

type FormCheckboxProps<T extends FieldValues> = {
  label: React.ReactNode
  name: FieldPath<T>
  description?: string
  control: Control<T>
  error?: string
  onBlur?: () => void
  rules?: RegisterOptions<T>
}

export const FormCheckbox = <T extends FieldValues>({
  label,
  name,
  description,
  control,
  error,
  onBlur,
  rules,
}: FormCheckboxProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <Field.Root invalid={!!error}>
          <Checkbox.Root
            checked={Boolean(field.value)}
            onCheckedChange={({ checked }) => field.onChange(Boolean(checked))}
            onBlur={onBlur}
            size="md">
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label>
              {typeof label === "string" ? (
                <Text fontWeight="semibold" textStyle={{ base: "xs", sm: "xs", md: "sm" }}>
                  {label}
                </Text>
              ) : (
                label
              )}
              <Text textStyle={{ base: "xs", md: "sm" }}>{description}</Text>
            </Checkbox.Label>
          </Checkbox.Root>
          {error && <Field.ErrorText>{error}</Field.ErrorText>}
        </Field.Root>
      )}
    />
  )
}

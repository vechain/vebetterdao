import { Field, HStack, Text, NativeSelect } from "@chakra-ui/react"
import { Control, Controller, UseFormRegisterReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

type FormDateSelectProps = {
  label?: string
  description?: string
  register: UseFormRegisterReturn
  control: Control<any>
  error?: string
  isOptional?: boolean
  options: { label: string; value: number }[]
  placeholder?: string
  defaultValue?: number
}
export const FormDateSelect = ({
  label,
  description,
  register,
  control,
  error,
  options,
  isOptional = false,
  placeholder,
  defaultValue,
}: FormDateSelectProps) => {
  const { t } = useTranslation()
  return (
    <Field.Root invalid={!!error}>
      {label && (
        <HStack justify="space-between" w="full">
          <Field.Label textStyle="sm" mb={description ? 0 : undefined} htmlFor={register.name}>
            {label}
          </Field.Label>
          {isOptional && (
            <Text textStyle="sm" color="text.subtle">
              {"Optional"}
            </Text>
          )}
        </HStack>
      )}
      {description && (
        <Text textStyle="xs" color="gray.500" mb={2}>
          {description}
        </Text>
      )}
      <Controller
        name={register.name}
        control={control}
        defaultValue={defaultValue}
        {...(!isOptional && { required: t("This field is required") })}
        render={({ field }) => (
          <NativeSelect.Root>
            <NativeSelect.Indicator />
            <NativeSelect.Field {...field} value={field.value?.toString() || ""} placeholder={placeholder}>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        )}
      />
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  )
}

import { Checkbox, Field, Text } from "@chakra-ui/react"
import { Control, Controller, FieldPath } from "react-hook-form"
import { SubmitCreatorFormData } from "../SubmitCreatorForm/SubmitCreatorForm"
import { GrantFormData } from "@/hooks/proposals/grants/types"

type FormData = SubmitCreatorFormData | GrantFormData

type FormCheckboxProps<TFormData extends FormData = FormData> = {
  label: string
  name: FieldPath<TFormData>
  description?: string
  control: Control<TFormData>
  error?: string
  onBlur?: () => void
}

export const FormCheckbox = <TFormData extends FormData = FormData>({
  label,
  name,
  description,
  control,
  error,
  onBlur,
}: FormCheckboxProps<TFormData>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field.Root invalid={!!error}>
          <Checkbox.Root
            checked={Boolean(field.value)}
            onCheckedChange={({ checked }) => field.onChange(Boolean(checked))}
            onBlur={onBlur}
            colorPalette="blue"
            size="md">
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label>
              <Text fontWeight="500" fontSize={{ base: "xs", sm: "xs", md: "sm" }}>
                {label}
              </Text>
              <Text fontSize={{ base: "xs", sm: "xs", md: "sm" }}>{description}</Text>
            </Checkbox.Label>
          </Checkbox.Root>
          {error && <Field.ErrorText>{error}</Field.ErrorText>}
        </Field.Root>
      )}
    />
  )
}

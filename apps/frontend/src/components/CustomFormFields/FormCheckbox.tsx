import { Checkbox, Field, Text } from "@chakra-ui/react"
import { UseFormRegisterReturn } from "react-hook-form"

type FormCheckboxProps = {
  label: string
  description?: string
  register: UseFormRegisterReturn
  error?: string
  onBlur?: () => void
}

export const FormCheckbox = ({ label, description, register, error, onBlur }: FormCheckboxProps) => {
  return (
    <Field.Root invalid={!!error}>
      <Checkbox.Root {...register} onBlur={onBlur} colorScheme="primary" size="lg">
        <Checkbox.Control />
        <Checkbox.Label>
          <Text fontWeight="500" fontSize={{ base: "xs", sm: "xs", md: "sm" }}>
            {label}
          </Text>
          <Text fontSize={{ base: "xs", sm: "xs", md: "sm" }}>{description}</Text>
        </Checkbox.Label>
      </Checkbox.Root>
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  )
}

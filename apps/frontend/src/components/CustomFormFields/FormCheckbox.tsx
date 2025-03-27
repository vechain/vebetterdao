import { Checkbox, FormControl, FormErrorMessage, Text } from "@chakra-ui/react"
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
    <FormControl isInvalid={!!error}>
      <Checkbox {...register} onBlur={onBlur} colorScheme="primary" size="lg">
        <Text fontWeight="500" fontSize={{ base: "xs", sm: "xs", md: "sm" }}>
          {label}
        </Text>
        <Text fontSize={{ base: "xs", sm: "xs", md: "sm" }}>{description}</Text>
      </Checkbox>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  )
}

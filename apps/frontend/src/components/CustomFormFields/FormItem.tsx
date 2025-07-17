import { FormControl, FormErrorMessage, FormLabel, Input, Text, Textarea } from "@chakra-ui/react"
import { UseFormRegisterReturn } from "react-hook-form"

type FormItemProps = {
  label: string
  description?: string
  placeholder?: string
  type?: "text" | "textarea" | "email" | "url"
  register: UseFormRegisterReturn
  error?: string
  onBlur?: () => void
}

export const FormItem = ({
  label,
  description,
  placeholder,
  type = "text",
  register,
  error,
  onBlur,
}: FormItemProps) => {
  const InputComponent = type === "textarea" ? Textarea : Input

  return (
    <FormControl isInvalid={!!error}>
      <FormLabel mb={description ? 0 : undefined} color="#252525">
        {label}
      </FormLabel>
      {description && (
        <Text fontSize="xs" color="gray.500" mb={2}>
          {description}
        </Text>
      )}
      <InputComponent placeholder={placeholder} {...register} onBlur={onBlur} rounded="xl" />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  )
}

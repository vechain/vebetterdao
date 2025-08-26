import { Field, Input, Text, Textarea } from "@chakra-ui/react"
import { UseFormRegisterReturn } from "react-hook-form"

type FormItemProps = {
  label?: string
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
    <Field.Root invalid={!!error}>
      {label && (
        <Field.Label fontSize="md" mb={description ? 0 : undefined} htmlFor={register.name}>
          {label}
        </Field.Label>
      )}
      {description && (
        <Text fontSize="xs" color="gray.500" mb={2}>
          {description}
        </Text>
      )}
      <InputComponent
        placeholder={placeholder}
        {...register}
        {...(type === "textarea" && !register?.maxLength && { maxLength: 100 })}
        {...(type === "textarea" && { h: "full" })}
        onBlur={onBlur}
        rounded="xl"
      />
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  )
}

import { Field, HStack, Input, Text, Textarea, InputGroup } from "@chakra-ui/react"
import { UseFormRegisterReturn } from "react-hook-form"

type FormItemProps = {
  label?: string
  description?: string
  placeholder?: string
  type?: "text" | "textarea" | "email" | "url" | "number"
  register: UseFormRegisterReturn
  error?: string
  onBlur?: () => void
  isOptional?: boolean
  leftElement?: React.ReactNode
}

export const FormItem = ({
  label,
  description,
  placeholder,
  type = "text",
  register,
  error,
  onBlur,
  isOptional = false,
  leftElement,
}: FormItemProps) => {
  const InputComponent = type === "textarea" ? Textarea : Input

  return (
    <Field.Root invalid={!!error} h={type === "textarea" ? "full" : "auto"}>
      {label && (
        <HStack justify="space-between" w="full">
          <Field.Label fontSize="sm" fontWeight="medium" mb={description ? 0 : undefined} htmlFor={register.name}>
            {label}
          </Field.Label>
          {isOptional && (
            <Text fontSize="sm" fontWeight="medium" color="text.subtle">
              {"Optional"}
            </Text>
          )}
        </HStack>
      )}
      {description && (
        <Text fontSize="xs" color="gray.500" mb={2}>
          {description}
        </Text>
      )}
      <InputGroup {...(leftElement && { startElement: leftElement })}>
        <InputComponent
          placeholder={placeholder}
          {...register}
          // {...(type === "textarea" && !register?.maxLength && { maxLength: 100 })}
          // {...(type === "textarea" && !register?.minLength && { minLength: 20 })}
          {...(type === "textarea" && {
            h: "full",
            minH: "120px",
            resize: "vertical",
          })}
          onBlur={onBlur}
          rounded="xl"
        />
      </InputGroup>
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  )
}

import { Tooltip } from "@/components/ui/tooltip"
import { Field, HStack, Icon, Input, InputGroup, Text, Textarea } from "@chakra-ui/react"
import { UseFormRegisterReturn } from "react-hook-form"
import { GoQuestion } from "react-icons/go"

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
  tooltip?: string
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
  tooltip,
}: FormItemProps) => {
  const InputComponent = type === "textarea" ? Textarea : Input

  return (
    <Field.Root invalid={!!error} h={type === "textarea" ? "full" : "auto"}>
      {label && (
        <HStack justify="space-between" w="full">
          <Field.Label
            fontSize="sm"
            fontWeight="400"
            color="text.default"
            mb={description ? 0 : undefined}
            htmlFor={register.name}>
            {label}
          </Field.Label>
          {tooltip && (
            <Tooltip content={tooltip} positioning={{ placement: "top" }} contentProps={{ p: 4, borderRadius: "lg" }}>
              <Icon as={GoQuestion} boxSize={5} color="icon.subtle" />
            </Tooltip>
          )}
          {isOptional && (
            <Text fontSize="sm" fontWeight="regular" color="text.subtle">
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

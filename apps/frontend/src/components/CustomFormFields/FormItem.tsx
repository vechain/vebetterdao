import { Tooltip } from "@/components/ui/tooltip"
import { Box, Field, HStack, Icon, Input, InputGroup, Text, Textarea } from "@chakra-ui/react"
import { UseFormRegisterReturn } from "react-hook-form"
import { useState } from "react"
import { GoQuestion } from "react-icons/go"

type FormItemProps = {
  label?: string
  description?: string
  placeholder?: string
  register: UseFormRegisterReturn
  type?: "text" | "textarea" | "email" | "url" | "number"
  defaultValue?: string
  error?: string
  onBlur?: () => void
  isOptional?: boolean
  leftElement?: React.ReactNode
  tooltip?: string
  maxLength?: number
}

export const FormItem = ({
  label,
  description,
  placeholder,
  type = "text",
  register,
  defaultValue,
  error,
  onBlur,
  isOptional = false,
  leftElement,
  tooltip,
  maxLength,
}: FormItemProps) => {
  const InputComponent = type === "textarea" ? Textarea : Input
  const [charCount, setCharCount] = useState(defaultValue?.length ?? 0)

  return (
    <Field.Root p={1} invalid={!!error} h={type === "textarea" ? "full" : "auto"}>
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
          {isOptional || tooltip ? (
            <HStack>
              {isOptional && (
                <Text fontSize="sm" fontWeight="regular" color="text.subtle">
                  {"Optional"}
                </Text>
              )}
              {tooltip && (
                <Tooltip
                  content={tooltip}
                  positioning={{ placement: "top" }}
                  contentProps={{ p: 4, borderRadius: "lg" }}>
                  <Icon as={GoQuestion} boxSize={5} color="icon.subtle" />
                </Tooltip>
              )}
            </HStack>
          ) : null}
        </HStack>
      )}
      {description && (
        <Text textStyle="xs" color="gray.500" mb={2}>
          {description}
        </Text>
      )}
      <InputGroup {...(leftElement && { startElement: leftElement })} h="full">
        <InputComponent
          placeholder={placeholder}
          {...register}
          {...(type === "textarea" && {
            h: "full",
            minH: "120px",
            resize: "vertical",
          })}
          onChange={e => {
            register.onChange(e) // Call the original register onChange
            setCharCount(e.target.value.length) // Update local character count
          }}
          onBlur={onBlur}
          borderRadius="xl"
        />
      </InputGroup>
      {/* Error text and character count */}
      {(error || (type === "textarea" && maxLength)) && (
        <HStack justify="space-between" w="full">
          <Box flex="1">{error && <Field.ErrorText>{error}</Field.ErrorText>}</Box>
          {type === "textarea" && maxLength && (
            <Field.HelperText>
              {charCount}
              {"/"}
              {maxLength}
            </Field.HelperText>
          )}
        </HStack>
      )}
    </Field.Root>
  )
}

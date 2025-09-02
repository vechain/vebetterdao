import { Field, HStack, Input, Text, Box, InputGroup } from "@chakra-ui/react"
import { UseFormRegisterReturn } from "react-hook-form"
import { useState } from "react"

type FormMoneyInputProps = {
  label?: string
  description?: string
  placeholder?: string
  register: UseFormRegisterReturn
  error?: string
  onBlur?: () => void
  isOptional?: boolean
  conversionRate?: number
}

export const FormMoneyInput = ({
  label,
  description,
  placeholder = "10,000",
  register,
  error,
  onBlur,
  isOptional = false,
  conversionRate,
}: FormMoneyInputProps) => {
  const [displayValue, setDisplayValue] = useState("")

  // Format number with commas
  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, "")
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Handle input change with formatting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "") // Keep only digits
    const formatted = formatCurrency(rawValue)
    setDisplayValue(formatted)

    // Update form with numeric value
    register.onChange({
      target: { name: register.name, value: rawValue },
    })
  }

  return (
    <Field.Root invalid={!!error}>
      <HStack justify="space-between" w="full" minH="5" mb={description ? 0 : 2}>
        {label ? (
          <Field.Label fontSize="sm" fontWeight="medium" htmlFor={register.name}>
            {label}
          </Field.Label>
        ) : (
          <Box />
        )}
        {isOptional && (
          <Text fontSize="sm" fontWeight="medium" color="text.subtle">
            {"Optional"}
          </Text>
        )}
      </HStack>

      {description && (
        <Text fontSize="xs" color="gray.500" mb={2}>
          {description}
        </Text>
      )}

      <InputGroup startElement="$" endElement="USD">
        <Input
          {...register}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          rounded="xl"
          textAlign="left"
        />
      </InputGroup>

      <Text fontSize="xs" color="text.subtle" mt={1}>
        {"1 USD = " + conversionRate + " B3TR"}
      </Text>

      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  )
}

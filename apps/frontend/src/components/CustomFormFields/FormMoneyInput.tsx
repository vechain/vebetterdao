import { MAX_DAPP_GRANT_AMOUNT } from "@/constants"
import { Box, Field, HStack, Input, InputGroup, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { UseFormRegisterReturn } from "react-hook-form"

type FormMoneyInputProps = {
  label?: string
  description?: string
  placeholder?: string
  registerPrimary: UseFormRegisterReturn
  registerSecondary: UseFormRegisterReturn
  error?: string
  onBlur?: () => void
  isOptional?: boolean
  conversionRate?: number
  onUsdChange?: (usdAmount: string, b3trAmount: string) => void
  initialValue?: number
  max?: number
}

/**
 * FormMoneyInput component for USD input with automatic token conversion
 *
 * This component allows users to input USD amounts while automatically calculating
 * and storing the equivalent token amount based on the conversion rate.
 *
 * @param label - The label for the input
 * @param description - The description for the input
 * @param placeholder - The placeholder for the input
 * @param registerPrimary - Register for the USD amount field (what user types)
 * @param registerSecondary - Register for the token amount field (calculated automatically)
 * @param error - The error message to display
 * @param onBlur - Callback when input loses focus
 * @param isOptional - Whether the input is optional
 * @param conversionRate - Exchange rate: 1 USD = X tokens (e.g., 1 USD = 2.5 B3TR)
 * @param onUsdChange - Callback with both USD and token amounts when value changes
 *
 * @example
 * // User types $1000, component automatically calculates 2500 B3TR (if rate = 2.5)
 * <FormMoneyInput
 *   registerPrimary={register("fundingAmountUsd")}     // Stores: 1000
 *   registerSecondary={register("fundingAmount")}      // Stores: 2500
 *   conversionRate={2.5}
 *   onUsdChange={(usd, tokens) => console.log(usd, tokens)} // 1000, 2500
 * />
 */
export const FormMoneyInput = ({
  label,
  description,
  placeholder = "10,000",
  registerPrimary,
  registerSecondary,
  error,
  onBlur,
  isOptional = false,
  conversionRate,
  onUsdChange,
  initialValue,
  max = MAX_DAPP_GRANT_AMOUNT,
}: FormMoneyInputProps) => {
  const [displayValue, setDisplayValue] = useState("")

  // Format number with commas
  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, "")
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Initialize displayValue with the initial value on mount
  useEffect(() => {
    if (initialValue && initialValue > 0) {
      setDisplayValue(formatCurrency(initialValue.toString()))
    }
  }, [initialValue])

  // Handle input change with formatting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "") // Keep only digits
    const cappedValue = Math.min(Number(rawValue), max)
    const formatted = formatCurrency(cappedValue.toString())
    setDisplayValue(formatted)

    const usdAmount = cappedValue
    const tokenAmount = conversionRate ? Math.ceil(usdAmount * conversionRate) : 0

    // Update form with USD value (what the user sees)
    registerPrimary.onChange({
      target: { name: registerPrimary.name, value: usdAmount },
    })

    // Update form with Token value
    registerSecondary.onChange({
      target: { name: registerSecondary.name, value: tokenAmount },
    })

    // Notify parent component about both USD and B3TR amounts
    onUsdChange?.(usdAmount.toString(), tokenAmount.toString())
  }

  return (
    <Field.Root invalid={!!error}>
      <HStack justify="space-between" w="full" minH="5" mb={description ? 0 : 2}>
        {label ? (
          <Field.Label fontSize="sm" fontWeight="medium" htmlFor={registerPrimary.name}>
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

      <InputGroup
        startElement="$"
        startElementProps={{
          px: "2",
          w: "8",
          h: "50%",
          borderRight: "sm",
          borderColor: "border.primary",
          color: "text.default",
          textStyle: "md",
        }}>
        <Input
          {...registerPrimary}
          size="xl"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          rounded="xl"
          textAlign="left"
          textStyle="md"
          p="3"
          style={{ paddingInlineStart: "2.5rem" }}
        />
      </InputGroup>

      {conversionRate && (
        <Text fontSize="xs" color="text.subtle" mt={1}>
          {displayValue
            ? `$${formatCurrency(displayValue)} USD = ${Math.round(Number(displayValue.replace(/,/g, "")) * conversionRate).toLocaleString()} B3TR`
            : `1 USD = ${conversionRate} B3TR`}
        </Text>
      )}

      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  )
}

import { Checkbox, Field, Text } from "@chakra-ui/react"
import { Control, Controller } from "react-hook-form"
import { SubmitCreatorFormData } from "../SubmitCreatorForm/SubmitCreatorForm"
import { GrantFormData } from "@/hooks/proposals/grants/types"

type FormCheckboxProps = {
  label: string
  name:
    | "securityApiSecurityMeasures"
    | "securityActionVerification"
    | "securityDeviceFingerprint"
    | "securitySecureKeyManagement"
    | "securityAntiFarming"
    | "termsOfService"
  description?: string
  control: Control<SubmitCreatorFormData> | Control<GrantFormData>
  error?: string
  onBlur?: () => void
}

export const FormCheckbox = ({ label, name, description, control, error, onBlur }: FormCheckboxProps) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field.Root invalid={!!error}>
          <Checkbox.Root
            checked={field.value}
            onCheckedChange={({ checked }) => field.onChange(checked)}
            onBlur={onBlur}
            colorPalette="blue"
            size="md">
            <Checkbox.HiddenInput />
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
      )}
    />
  )
}

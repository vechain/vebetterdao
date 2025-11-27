import { CloseButton, Input, InputGroup, InputGroupProps, InputProps } from "@chakra-ui/react"
import { LuSearch } from "react-icons/lu"

interface SearchFieldProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  inputProps?: InputProps
  inputWrapperProps?: Omit<InputGroupProps, "children">
}
export const SearchField = ({
  placeholder = "Search",
  value,
  onChange,
  disabled,
  inputProps,
  inputWrapperProps,
}: SearchFieldProps) => {
  return (
    <InputGroup
      flex="1"
      startElement={<LuSearch />}
      endElement={value ? <CloseButton size="xs" onClick={() => onChange?.("")} me="-2" /> : undefined}
      {...inputWrapperProps}>
      <Input
        {...inputProps}
        {...(disabled && { disabled: true })}
        placeholder={placeholder}
        borderRadius={"xl"}
        bg="bg.primary"
        border="border.primary"
        value={value}
        onChange={e => onChange?.(e.target.value)}
      />
    </InputGroup>
  )
}

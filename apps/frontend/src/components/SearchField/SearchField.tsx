import { Input, InputGroup, InputProps } from "@chakra-ui/react"
import { LuSearch } from "react-icons/lu"

interface SearchFieldProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  inputProps?: InputProps
}
export const SearchField = ({ placeholder = "Search", value, onChange, disabled, inputProps }: SearchFieldProps) => {
  return (
    <InputGroup flex="1" startElement={<LuSearch />}>
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

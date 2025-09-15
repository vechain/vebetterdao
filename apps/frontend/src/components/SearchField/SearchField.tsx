import { Input, InputGroup } from "@chakra-ui/react"
import { LuSearch } from "react-icons/lu"

interface SearchFieldProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
}

export const SearchField = ({ placeholder = "Search", value, onChange, disabled }: SearchFieldProps) => {
  return (
    <InputGroup flex="1" startElement={<LuSearch />}>
      <Input
        {...(disabled && { disabled: true })}
        placeholder={placeholder}
        variant="filled"
        borderRadius={"xl"}
        value={value}
        onChange={e => onChange?.(e.target.value)}
      />
    </InputGroup>
  )
}

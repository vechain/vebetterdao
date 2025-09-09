import { InputGroup, Input } from "@chakra-ui/react"
import { LuSearch } from "react-icons/lu"

export const SearchField = () => {
  return (
    <InputGroup flex="1" startElement={<LuSearch />}>
      <Input placeholder={"Search"} variant="filled" borderRadius={"xl"} />
    </InputGroup>
  )
}

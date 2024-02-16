import { XApp } from "@/api"
import { FieldErrors, UseFormGetValues, UseFormRegister } from "react-hook-form"
import { FormData } from "../AllocationRoundUserVotes"
import {
  Box,
  FormControl,
  FormErrorMessage,
  HStack,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react"
import { FaRecycle } from "react-icons/fa6"

type Props = {
  register: UseFormRegister<FormData>
  getValues: UseFormGetValues<FormData>
  index: number
  xApp?: XApp
  field: FormData["votes"][number]
  errors: FieldErrors<FormData>
}

export const SelectAppVotesInput = ({ register, getValues, index, xApp, field, errors }: Props) => {
  console.log("errors", errors)
  return (
    <HStack
      w="full"
      justify={"space-between"}
      key={field.id}
      borderWidth={1}
      borderColor={"gray"}
      borderRadius={"lg"}
      py={2}
      px={4}>
      <HStack spacing={2} align="center">
        <Icon as={FaRecycle} />
        <Heading size="sm">{xApp?.name}</Heading>
      </HStack>
      <Box>
        <FormControl isInvalid={!!errors.votes?.[index]}>
          <InputGroup>
            <Input
              {...register(`votes.${index}.value`, {
                valueAsNumber: true,
                min: 0,
                max: 100,
                validate: value => {
                  if (isNaN(value)) return "Please enter a valid number"
                  const allValuesTotal = getValues().votes.reduce((acc, vote) => acc + vote.value, 0)
                  if (allValuesTotal > 100) return "Total votes exceed 100"
                  return true
                },
              })}
              w="full"
            />
            <InputRightElement children="%" />
          </InputGroup>
          {errors.votes?.[index]?.value && <FormErrorMessage>{errors.votes?.[index]?.message}</FormErrorMessage>}
        </FormControl>
      </Box>
    </HStack>
  )
}

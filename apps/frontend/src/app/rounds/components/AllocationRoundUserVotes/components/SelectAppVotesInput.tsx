import { XApp } from "@/api"
import { FieldErrors, UseFormGetValues, UseFormRegister } from "react-hook-form"
import { FormData } from "../AllocationRoundUserVotes"
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
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
  isDisabled?: boolean
  totalVotesAvailable?: string
}

export const SelectAppVotesInput = ({
  register,
  getValues,
  index,
  xApp,
  field,
  errors,
  isDisabled = false,
  totalVotesAvailable,
}: Props) => {
  console.log("errors", errors, "totalVotes", totalVotesAvailable)

  const value = getValues().votes[index]?.value
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
      <HStack spacing={2} align="center" flex={1}>
        <Icon as={FaRecycle} />
        <Heading size="sm">{xApp?.name}</Heading>
      </HStack>
      <Box flex={[1, 1, 0.5]}>
        <FormControl isInvalid={!!errors.votes?.[index]} isDisabled={isDisabled}>
          <InputGroup>
            <Input
              {...register(`votes.${index}.value`, {
                valueAsNumber: true,
                validate: value => {
                  if (isNaN(value)) return "Please enter a valid number"
                  if (value < 0) return "Votes cannot be negative"
                  const allValuesTotal = getValues().votes.reduce((acc, vote) => acc + vote.value, 0)
                  if (allValuesTotal > 100) return "Total votes exceed 100"
                  return true
                },
              })}
              w="full"
            />
            <InputRightElement children="%" />
          </InputGroup>
          {!errors.votes?.[index]?.value ? (
            <FormHelperText>=~ {(Number(value) * Number(totalVotesAvailable)) / 100} votes</FormHelperText>
          ) : (
            <FormErrorMessage>{errors.votes?.[index]?.value?.message}</FormErrorMessage>
          )}
        </FormControl>
      </Box>
    </HStack>
  )
}

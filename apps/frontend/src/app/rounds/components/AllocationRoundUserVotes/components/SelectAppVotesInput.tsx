import { XApp, useXAppMetadata } from "@/api"
import { FieldErrors, UseFormGetValues, UseFormRegister } from "react-hook-form"
import { FormData } from "../AllocationRoundUserVotes"
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  HStack,
  Heading,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Skeleton,
  Stack,
} from "@chakra-ui/react"
import { useIpfsImage } from "@/api/ipfs"

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

  const { data: appMetadata, error: appMetadatError } = useXAppMetadata(xApp?.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const value = getValues().votes[index]?.value
  return (
    <Stack
      direction={["column", "column", "row"]}
      spacing={4}
      w="full"
      justify={"space-between"}
      key={field.id}
      borderWidth={1}
      borderColor={"gray"}
      borderRadius={"lg"}
      py={2}
      px={4}>
      <HStack spacing={[2, 2, 4]} align="center" flex={1}>
        <Skeleton isLoaded={!isLogoLoading} borderRadius={"full"}>
          <Image src={logo?.image} alt={appMetadata?.name} boxSize={[8, 8, 10]} borderRadius="full" />
        </Skeleton>
        <Heading size={["md", "md", "sm"]}>{xApp?.name}</Heading>
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
    </Stack>
  )
}

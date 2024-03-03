import { XApp, useXAppMetadata } from "@/api"
import { Control, Controller, FieldErrors, UseFormGetValues, UseFormRegister } from "react-hook-form"
import { FormData } from "../AllocationRoundUserVotes"
import {
  Box,
  Card,
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
import { notFoundImage } from "@/constants"
import { CastAllocationVotesProps } from "@/hooks"
import BigNumber from "bignumber.js"

type Props = {
  control: Control<{
    votes: CastAllocationVotesProps
  }>
  getValues: UseFormGetValues<FormData>
  index: number
  xApp?: XApp
  field: FormData["votes"][number]
  errors: FieldErrors<FormData>
  isDisabled?: boolean
  totalVotesAvailable?: string
}

export const SelectAppVotesInput = ({
  control,
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
    <Card variant={"baseWithBorder"} key={field.id} w="full">
      <Stack direction={["column", "column", "row"]} spacing={4} justify={"space-between"} py={2} px={4}>
        <HStack spacing={[2, 2, 3]} align="center" flex={1}>
          <Skeleton isLoaded={!isLogoLoading}>
            <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={12} borderRadius="9px" />
          </Skeleton>
          <Heading size={["md", "md", "sm"]}>{xApp?.name}</Heading>
        </HStack>
        <Box flex={[1, 1, 0.5]}>
          <FormControl isInvalid={!!errors.votes?.[index]} isDisabled={isDisabled}>
            <InputGroup>
              <Controller
                control={control}
                name={`votes.${index}.value`}
                rules={{
                  validate: {
                    lessThanHundred: () => {
                      const allValuesTotal = getValues().votes.reduce((acc, vote) => acc + Number(vote.value) || 0, 0)
                      if (allValuesTotal > 100) return "Total votes exceed 100"
                      return true
                    },
                  },
                }}
                render={({ field: { onChange, value } }) => {
                  return (
                    <Input
                      w="full"
                      placeholder="0"
                      value={value}
                      onChange={e => {
                        const newValue = e.target.value
                          .replace(",", ".") // Replace comma with dot
                          .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
                          .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators
                          .replace(/(\.\d\d)\d+/g, "$1") // Remove decimal digits after the second one

                        if (Number(newValue) > Number("100")) {
                          onChange("100")
                        } else {
                          onChange(newValue)
                        }
                      }}
                      isDisabled={isDisabled}
                    />
                  )
                }}
              />
              <InputRightElement children="%" />
            </InputGroup>
            {!errors.votes?.[index]?.value ? (
              <FormHelperText>
                =~{" "}
                {new BigNumber((Number(value) * Number(totalVotesAvailable)) / 100).toFixed(
                  2,
                  BigNumber.ROUND_HALF_DOWN,
                )}{" "}
                votes
              </FormHelperText>
            ) : (
              <FormErrorMessage>{errors.votes?.[index]?.value?.message}</FormErrorMessage>
            )}
          </FormControl>
        </Box>
      </Stack>
    </Card>
  )
}

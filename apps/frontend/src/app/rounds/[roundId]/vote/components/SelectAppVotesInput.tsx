import { XApp, useXAppMetadata } from "@/api"
import { Control, Controller, FieldArrayWithId, FieldErrors, UseFormGetValues } from "react-hook-form"
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
import { scaledDivision } from "@/utils/MathUtils"
import { CastAllocationVoteFormData } from "./CastAllocationVotePageContent/CastAllocationVotePageContent"
import BigNumber from "bignumber.js"

type Props = {
  control: Control<{
    votes: CastAllocationVoteFormData["votes"]
  }>
  getValues: UseFormGetValues<CastAllocationVoteFormData>
  index: number
  xApp?: XApp
  field: FieldArrayWithId<CastAllocationVoteFormData, "votes", "id">
  errors: FieldErrors<CastAllocationVoteFormData>
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
  const { data: appMetadata } = useXAppMetadata(xApp?.id)
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
                name={`votes.${index}`}
                rules={{
                  validate: {
                    lessThanHundred: () => {
                      const allValuesTotal = getValues().votes.reduce(
                        (acc, vote) => acc + Number(vote.rawValue) || 0,
                        0,
                      )
                      if (allValuesTotal > 100) return "Total votes exceed 100"
                      return true
                    },
                  },
                }}
                render={({ field: { onChange, value } }) => {
                  return (
                    <Input
                      data-testid={`${xApp?.name}-vote-input`}
                      w="full"
                      placeholder="0"
                      value={value.value}
                      onChange={e => {
                        const newValue = e.target.value
                          .replace(",", ".") // Replace comma with dot
                          .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
                          .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators
                          .replace(/(\.\d\d)\d+/g, "$1") // Remove decimal digits after the second one

                        if (Number(newValue) > 100) {
                          onChange({
                            rawValue: 100,
                            value: "100",
                            appId: value.appId,
                          })
                        } else {
                          onChange({
                            rawValue: Number(newValue),
                            value: newValue,
                            appId: value.appId,
                          })
                        }
                      }}
                      isDisabled={isDisabled}
                    />
                  )
                }}
              />
              <InputRightElement>%</InputRightElement>
            </InputGroup>
            {value && totalVotesAvailable && !errors.votes?.[index] ? (
              <FormHelperText data-testid={`${xApp?.name}-vote-estimated-votes`}>
                =~{" "}
                {new BigNumber(scaledDivision(Number(value) * Number(totalVotesAvailable), 100)).toFixed(
                  2,
                  BigNumber.ROUND_DOWN,
                )}{" "}
                votes
              </FormHelperText>
            ) : (
              <FormErrorMessage data-testid={`${xApp?.name}-vote-error`}>
                {errors.votes?.[index]?.message}
              </FormErrorMessage>
            )}
          </FormControl>
        </Box>
      </Stack>
    </Card>
  )
}

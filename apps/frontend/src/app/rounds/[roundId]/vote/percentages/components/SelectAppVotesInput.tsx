import { useXAppMetadata } from "@/api"
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
import { notFoundImage } from "@/constants"
import { scaledDivision } from "@/utils/MathUtils"
import BigNumber from "bignumber.js"
import { t } from "i18next"
import { CastAllocationVoteFormData } from "@/store"

const estimateVotes = (value: number | string, totalVotesAvailable: number | string) => {
  return scaledDivision(Number(value) * Number(totalVotesAvailable), 100)
}

type Props = {
  onChange: (_data: CastAllocationVoteFormData) => void
  vote: CastAllocationVoteFormData
  error?: string
  isDisabled?: boolean
  totalVotesAvailable?: string
}

export const SelectAppVotesInput = ({ onChange, vote, isDisabled = false, totalVotesAvailable, error }: Props) => {
  const { data: appMetadata } = useXAppMetadata(vote.appId)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  return (
    <Stack
      direction={["column", "column", "row"]}
      spacing={4}
      justify={"space-between"}
      align={["flex-start", "flex-start", "center"]}
      py={[4, 4, "16px"]}
      px={[4, 4, "24px"]}
      borderRadius={"16px"}
      w="full"
      bg="endorsement-info-bg">
      <HStack spacing={[2, 2, 3]} align="center" flex={1}>
        <Skeleton isLoaded={!isLogoLoading}>
          <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={"64px"} borderRadius="9px" />
        </Skeleton>
        <Heading size={["16px"]} fontWeight={500}>
          {appMetadata?.name}
        </Heading>
      </HStack>
      <Box flex={[1, 1, 0.5]} w="full">
        <FormControl isInvalid={!!error} isDisabled={isDisabled}>
          <InputGroup>
            <Input
              borderRadius={"12px"}
              borderWidth={1}
              borderColor={"#D5D5D5"}
              bg="#FFFFFF"
              data-testid={`${appMetadata?.name}-vote-input`}
              w="full"
              color="#6A6A6A"
              placeholder="0"
              value={vote.value}
              onChange={e => {
                const newValue = e.target.value
                  .replace(",", ".") // Replace comma with dot
                  .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
                  .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators
                  .replace(/(\.\d\d)\d+/g, "$1") // Remove decimal digits after the second one

                let valueToChange
                if (Number(newValue) > 100) {
                  valueToChange = {
                    rawValue: 100,
                    value: "100",
                    appId: vote.appId,
                  }
                } else {
                  valueToChange = {
                    rawValue: Number(newValue),
                    value: newValue,
                    appId: vote.appId,
                  }
                }
                onChange(valueToChange)
              }}
              isDisabled={isDisabled}
            />
            <InputRightElement fontWeight={400} color="#6A6A6A" fontSize={"16px"}>
              {t("%")}
            </InputRightElement>
          </InputGroup>
          {totalVotesAvailable && !error ? (
            <FormHelperText
              data-testid={`${appMetadata?.name}-vote-estimated-votes`}
              fontWeight={400}
              fontSize={"16px"}
              color="#6A6A6A">
              {t("=~ {{value}} votes", {
                value: new BigNumber(estimateVotes(vote.rawValue, totalVotesAvailable)).toFixed(
                  2,
                  BigNumber.ROUND_DOWN,
                ),
              })}
            </FormHelperText>
          ) : (
            <FormErrorMessage data-testid={`${appMetadata?.name}-vote-error`} fontWeight={400} fontSize={"16px"}>
              {error}
            </FormErrorMessage>
          )}
        </FormControl>
      </Box>
    </Stack>
  )
}

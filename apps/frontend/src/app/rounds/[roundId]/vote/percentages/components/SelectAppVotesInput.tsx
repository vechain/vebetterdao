import { useXAppMetadata } from "@/api"
import { Box, Field, HStack, Heading, Image, Input, InputGroup, Skeleton, Stack, Text } from "@chakra-ui/react"
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
      gap={4}
      justify={"space-between"}
      align={["flex-start", "flex-start", "center"]}
      py={[4, 4, "16px"]}
      px={[4, 4, "24px"]}
      borderRadius={"16px"}
      w="full"
      bg="light-contrast-on-card-bg">
      <HStack gap={[2, 2, 3]} align="center" flex={1}>
        <Skeleton loading={isLogoLoading}>
          <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={"64px"} borderRadius="9px" />
        </Skeleton>
        <Heading size="md" fontWeight="semibold">
          {appMetadata?.name}
        </Heading>
      </HStack>
      <Box flex={[1, 1, 0.5]} w="full">
        <Field.Root invalid={!!error} disabled={isDisabled}>
          <InputGroup
            endElement={
              <Text color="text.subtle" textStyle="md">
                {t("%")}
              </Text>
            }>
            <Input
              borderRadius={"12px"}
              borderWidth={1}
              borderColor={"#D5D5D5"}
              bg="#FFFFFF"
              data-testid={`${appMetadata?.name}-vote-input`}
              w="full"
              color="text.subtle"
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
              disabled={isDisabled}
            />
          </InputGroup>
          {totalVotesAvailable && !error ? (
            <Field.HelperText
              data-testid={`${appMetadata?.name}-vote-estimated-votes`}
              textStyle="md"
              color="text.subtle">
              {t("=~ {{value}} votes", {
                value: new BigNumber(estimateVotes(vote.rawValue, totalVotesAvailable)).toFixed(
                  2,
                  BigNumber.ROUND_DOWN,
                ),
              })}
            </Field.HelperText>
          ) : (
            <Field.ErrorText data-testid={`${appMetadata?.name}-vote-error`} textStyle="md">
              {error}
            </Field.ErrorText>
          )}
        </Field.Root>
      </Box>
    </Stack>
  )
}

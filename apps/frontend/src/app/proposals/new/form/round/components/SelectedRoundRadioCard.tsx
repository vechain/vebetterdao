import { Card, VStack, HStack, Heading, Radio, Box, Skeleton } from "@chakra-ui/react"

type Props = {
  roundId: number
  selected: boolean
  onSelect: () => void
  renderSkeleton?: boolean
}
export const SelectedRoundRadioCard: React.FC<Props> = ({ roundId, selected, onSelect, renderSkeleton }) => {
  return (
    <Card
      w="full"
      onClick={onSelect}
      {...(!renderSkeleton && { cursor: "pointer" })}
      {...(renderSkeleton && { pointerEvents: "none" })}
      borderWidth={1}
      borderColor={selected ? "primary.active" : "gray.200"}
      borderRadius="xl"
      {...(selected && {
        boxShadow: "0px 0px 16px 0px rgba(0, 76, 252, 0.35)",
      })}
      p={6}
      {...(!renderSkeleton && {
        _hover: { borderColor: "primary.active", transition: "border-color 0.2s" },
      })}>
      <VStack spacing={4} align="flex-start">
        <HStack justify="space-between" w="full">
          <Box>
            <Skeleton isLoaded={!renderSkeleton}>
              <Heading size="md">Round #{roundId}</Heading>
            </Skeleton>
            {/* <Text fontSize="lg" fontWeight="600">
            {round.date}
          </Text> */}
          </Box>
          <Radio isChecked={selected} isDisabled={renderSkeleton} />
        </HStack>
      </VStack>
    </Card>
  )
}
